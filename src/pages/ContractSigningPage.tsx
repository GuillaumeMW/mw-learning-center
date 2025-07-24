import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CertificationWorkflow {
  current_step: string;
  exam_status: string;
  admin_approval_status: string;
  contract_status: string;
  contract_doc_url?: string;
}

const ContractSigningPage = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workflow, setWorkflow] = useState<CertificationWorkflow | null>(null);

  useEffect(() => {
    if (user && level) {
      fetchWorkflowDetails();
    }
  }, [user, level]);

  const fetchWorkflowDetails = async () => {
    try {
      const levelNum = parseInt(level!);
      
      const { data: workflowData } = await supabase
        .from('certification_workflows')
        .select('current_step, exam_status, admin_approval_status, contract_status, contract_doc_url')
        .eq('user_id', user!.id)
        .eq('level', levelNum)
        .maybeSingle();

      setWorkflow(workflowData);
    } catch (error) {
      console.error('Error fetching workflow details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contract details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!user || !level) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-signnow-contract', {
        body: {
          user_id: user.id,
          level: parseInt(level)
        }
      });

      if (error) throw error;

      if (data.signing_url) {
        // Open SignNow in a new tab
        window.open(data.signing_url, '_blank');
        
        toast({
          title: 'Contract Signing Started',
          description: 'Please complete the contract signing process in the new window.',
        });
        
        // Refresh workflow data after a short delay
        setTimeout(() => {
          fetchWorkflowDetails();
        }, 2000);
      }
    } catch (error) {
      console.error('Error triggering contract signing:', error);
      toast({
        title: 'Error',
        description: 'Failed to start contract signing process',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getContractStatusInfo = () => {
    if (!workflow) {
      return {
        status: 'not_available',
        message: 'Contract not available',
        color: 'secondary' as const,
        icon: AlertCircle
      };
    }

    switch (workflow.contract_status) {
      case 'not_required':
        return {
          status: 'not_required',
          message: 'Contract not yet available',
          color: 'secondary' as const,
          icon: FileText
        };
      case 'pending_signing':
        return {
          status: 'pending',
          message: 'Ready to sign',
          color: 'default' as const,
          icon: FileText
        };
      case 'signed':
        return {
          status: 'signed',
          message: 'Contract signed',
          color: 'default' as const,
          icon: CheckCircle2
        };
      case 'declined':
        return {
          status: 'declined',
          message: 'Contract declined',
          color: 'destructive' as const,
          icon: AlertCircle
        };
      default:
        return {
          status: 'unknown',
          message: 'Unknown status',
          color: 'secondary' as const,
          icon: AlertCircle
        };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading contract details...</span>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getContractStatusInfo();
  const canSign = workflow && 
    workflow.admin_approval_status === 'approved' && 
    workflow.current_step === 'contract' && 
    workflow.contract_status !== 'signed';

  const needsApproval = !workflow || workflow.admin_approval_status !== 'approved';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Level {level} Contract Signing</h1>
          <p className="text-muted-foreground">
            Sign your Relocation Specialist Agreement to continue your certification
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <statusInfo.icon className="h-5 w-5" />
              Contract Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Status:</span>
              <Badge variant={statusInfo.color}>{statusInfo.message}</Badge>
            </div>
            
            {workflow && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Admin Approval:</span>
                  <Badge variant={workflow.admin_approval_status === 'approved' ? 'default' : 'secondary'}>
                    {workflow.admin_approval_status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Step:</span>
                  <Badge variant="outline">{workflow.current_step}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Approval Message */}
        {needsApproval && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                Awaiting Admin Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700">
                Your exam is currently being reviewed by our team. Contract signing will be available 
                once your exam has been approved.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/')}
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Contract Information */}
        {canSign && (
          <Card>
            <CardHeader>
              <CardTitle>Relocation Specialist Agreement</CardTitle>
              <CardDescription>
                Please review and sign your certification agreement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">What this agreement includes:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Terms and conditions of your certification</li>
                  <li>Professional conduct standards</li>
                  <li>Certification maintenance requirements</li>
                  <li>Rights and responsibilities as a certified specialist</li>
                  <li>Subscription terms and payment obligations</li>
                </ul>
              </div>
              
              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleSignContract}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting Signing Process...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Sign Contract Now
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                You will be redirected to SignNow to complete the electronic signature process
              </p>
            </CardContent>
          </Card>
        )}

        {/* Already Signed */}
        {workflow && workflow.contract_status === 'signed' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Contract Signed Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your contract has been successfully signed. You can now proceed to the payment step.
              </p>
              
              {workflow.contract_doc_url && (
                <Button 
                  variant="outline"
                  onClick={() => window.open(workflow.contract_doc_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Signed Contract
                </Button>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate(`/certification/${level}/payment`)}
                >
                  Proceed to Payment
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract Declined */}
        {workflow && workflow.contract_status === 'declined' && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                Contract Declined
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                You have declined the contract. Please contact support if you wish to proceed with your certification.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ContractSigningPage;