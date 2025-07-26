import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ClipboardCheck, CheckCircle, XCircle, Eye, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CertificationWorkflowWithProfile {
  id: string;
  user_id: string;
  level: number;
  current_step: string;
  exam_status: string;
  admin_approval_status: string;
  contract_status: string;
  subscription_status: string;
  exam_results_json?: any;
  exam_submission_url?: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
}

const CertificationReview = () => {
  const [workflows, setWorkflows] = useState<CertificationWorkflowWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingCertifications();
  }, []);

  const fetchPendingCertifications = async () => {
    try {
      // Get all users who have completed all sections for any course level
      // First, get all user progress with course information
      const { data: usersWithProgress, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          course_id,
          subsection_id,
          completed_at,
          courses!inner (
            id,
            level,
            title
          )
        `)
        .not('completed_at', 'is', null);

      if (progressError) throw progressError;

      // Get all subsections for each course to check completion
      const courseIds = [...new Set(usersWithProgress?.map(p => p.course_id))];
      const { data: allSubsections, error: subsectionError } = await supabase
        .from('subsections')
        .select('id, section_id, sections!inner(course_id)')
        .in('sections.course_id', courseIds);

      if (subsectionError) throw subsectionError;

      // Group subsections by course
      const subsectionsByCourse = allSubsections?.reduce((acc, sub) => {
        const courseId = (sub.sections as any).course_id;
        if (!acc[courseId]) acc[courseId] = [];
        acc[courseId].push(sub.id);
        return acc;
      }, {} as Record<string, string[]>) || {};

      // Find users who have completed all subsections for their course
      const userCompletionMap = usersWithProgress?.reduce((acc, progress) => {
        const key = `${progress.user_id}-${progress.course_id}`;
        if (!acc[key]) {
          acc[key] = {
            user_id: progress.user_id,
            course_id: progress.course_id,
            level: (progress.courses as any).level,
            completedSubsections: new Set()
          };
        }
        acc[key].completedSubsections.add(progress.subsection_id);
        return acc;
      }, {} as Record<string, any>) || {};

      // Filter users who have completed ALL subsections for their course
      const eligibleUsers = Object.values(userCompletionMap).filter(user => {
        const requiredSubsections = subsectionsByCourse[user.course_id] || [];
        return requiredSubsections.length > 0 && 
               requiredSubsections.every(subId => user.completedSubsections.has(subId));
      });

      if (eligibleUsers.length === 0) {
        setWorkflows([]);
        return;
      }

      // Get profile information for eligible users
      const eligibleUserIds = eligibleUsers.map(u => u.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', eligibleUserIds);

      if (profileError) throw profileError;

      // Now check existing certification workflows for these users
      const { data: existingWorkflows, error: workflowError } = await supabase
        .from('certification_workflows')
        .select('*')
        .in('user_id', eligibleUserIds);

      if (workflowError) throw workflowError;

      // Create workflows for users who don't have one yet, or get existing ones
      const workflowsToDisplay = [];
      
      for (const user of eligibleUsers) {
        // Find profile for this user
        const profile = profileData?.find(p => p.user_id === user.user_id);
        
        let workflow = existingWorkflows?.find(w => 
          w.user_id === user.user_id && w.level === user.level
        );
        
        if (!workflow) {
          // Create a new workflow for this user
          const { data: newWorkflow, error: createError } = await supabase
            .from('certification_workflows')
            .insert({
              user_id: user.user_id,
              course_id: user.course_id,
              level: user.level,
              current_step: 'exam',
              exam_status: 'pending_submission',
              admin_approval_status: 'pending'
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating workflow:', createError);
            continue;
          }
          workflow = newWorkflow;
        }

        // Only show workflows that are pending admin approval
        if (workflow.admin_approval_status === 'pending') {
          workflowsToDisplay.push({
            ...workflow,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || ''
          });
        }
      }
      
      setWorkflows(workflowsToDisplay);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certification requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (userId: string, level: number, action: 'approve' | 'reject') => {
    const actionKey = `${userId}-${level}`;
    setActionLoading(actionKey);
    
    try {
      const { data, error } = await supabase.functions.invoke('handle-admin-certification-action', {
        body: {
          user_id: userId,
          level,
          action
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Certification ${action}d successfully`,
      });

      // Refresh the list
      await fetchPendingCertifications();
    } catch (error) {
      console.error(`Error ${action}ing certification:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} certification`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string, type: 'exam' | 'contract' | 'subscription') => {
    const variants = {
      pending_submission: 'secondary',
      submitted: 'default',
      passed: 'default',
      failed: 'destructive',
      not_required: 'secondary',
      pending_signing: 'default',
      signed: 'default',
      declined: 'destructive',
      pending_payment: 'default',
      active: 'default',
      cancelled: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading certification requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8" />
          Certification Review Dashboard
        </h1>
        <p className="text-muted-foreground">
          Review and approve students who have completed all course sections
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students Ready for Certification Review</CardTitle>
          <CardDescription>
            {workflows.length} student{workflows.length !== 1 ? 's' : ''} who completed all sections awaiting review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Students Ready for Review</h3>
              <p className="text-muted-foreground">
                No students have completed all course sections yet, or all have been reviewed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Exam Status</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div className="font-medium">
                          {workflow.first_name} {workflow.last_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Level {workflow.level}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(workflow.exam_status, 'exam')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(workflow.contract_status, 'contract')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(workflow.subscription_status, 'subscription')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{workflow.current_step}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/users/${workflow.user_id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                disabled={actionLoading === `${workflow.user_id}-${workflow.level}`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve Certification</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve this Level {workflow.level} certification for {workflow.first_name} {workflow.last_name}?
                                  This will allow them to proceed to the contract signing step.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleApprovalAction(workflow.user_id, workflow.level, 'approve')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={actionLoading === `${workflow.user_id}-${workflow.level}`}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Certification</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reject this Level {workflow.level} certification for {workflow.first_name} {workflow.last_name}?
                                  This will require them to retake the exam.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleApprovalAction(workflow.user_id, workflow.level, 'reject')}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificationReview;