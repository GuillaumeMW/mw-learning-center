import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Clock, 
  BookOpen,
  CheckCircle,
  Circle,
  TrendingUp,
  Target,
  Timer,
  Loader2,
  Phone,
  Globe,
  GraduationCap,
  FileText
} from 'lucide-react';
import { useState as useReactState, useEffect as useReactEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';

// Certification Status Component
const CertificationStatusDisplay = ({ userId }: { userId: string }) => {
  const [workflows, setWorkflows] = useReactState<any[]>([]);
  const [loading, setLoading] = useReactState(true);

  useReactEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const { data, error } = await supabase
          .from('certification_workflows')
          .select('*, courses(title, level)')
          .eq('user_id', userId)
          .order('level');

        if (error) throw error;
        setWorkflows(data || []);
      } catch (error) {
        console.error('Error fetching certification workflows:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [userId]);

  if (loading) {
    return <div>Loading certification status...</div>;
  }

  if (workflows.length === 0) {
    return <div className="text-muted-foreground">No certification workflows started</div>;
  }

  const getStatusBadge = (workflow: any) => {
    if (workflow.subscription_status === 'active') {
      return <Badge className="bg-green-600">Certified</Badge>;
    }
    
    switch (workflow.current_step) {
      case 'exam':
        return <Badge variant="outline">Exam Phase</Badge>;
      case 'admin_approval':
        return <Badge variant="secondary">Under Review</Badge>;
      case 'contract':
        return <Badge variant="outline">Contract Phase</Badge>;
      case 'payment':
        return <Badge variant="outline">Payment Phase</Badge>;
      default:
        return <Badge variant="outline">In Progress</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {workflows.map((workflow) => (
        <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-4 w-4 text-primary" />
            <div>
              <div className="font-medium">Level {workflow.level} Certification</div>
              <div className="text-sm text-muted-foreground">
                {workflow.courses?.title}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(workflow)}
          </div>
        </div>
      ))}
    </div>
  );
};

interface UserDetailData {
  id: string;
  email: string;
  created_at: string;
  profile: {
    first_name: string;
    last_name: string;
    phone_number: string | null;
    address_line1: string;
    address_line2: string | null;
    city: string;
    province_state: string;
    postal_code: string;
    country: string;
    employment_status: 'employed' | 'self_employed' | 'student' | 'unemployed' | 'other';
    occupation: string | null;
    service_regions: string[] | null;
    languages_spoken: string[] | null;
    avatar_url: string | null;
  };
  role: 'student' | 'admin';
  courses: CourseDetail[];
  overallStats: {
    totalCourses: number;
    completedCourses: number;
    totalSubsections: number;
    completedSubsections: number;
    overallProgress: number;
    averageCompletionTime: number;
  };
}

interface CourseDetail {
  id: string;
  title: string;
  level: number;
  description: string | null;
  is_available: boolean;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  sections: SectionDetail[];
}

interface SectionDetail {
  id: string;
  title: string;
  order_index: number;
  subsections: SubsectionDetail[];
}

interface SubsectionDetail {
  id: string;
  title: string;
  subsection_type: 'content' | 'quiz';
  order_index: number;
  duration_minutes: number | null;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  time_spent_minutes: number | null;
}

const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetail = async () => {
    if (!userId) return;
    
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) throw roleError;

      // Get all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('level');

      if (coursesError) throw coursesError;

      // Get all sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('order_index');

      if (sectionsError) throw sectionsError;

      // Get all subsections
      const { data: subsectionsData, error: subsectionsError } = await supabase
        .from('subsections')
        .select('*')
        .order('order_index');

      if (subsectionsError) throw subsectionsError;

      // Get user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) throw progressError;

      // Get course completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('course_completions')
        .select('*')
        .eq('user_id', userId);

      if (completionsError) throw completionsError;

      // Process the data
      const processedCourses: CourseDetail[] = coursesData.map(course => {
        const courseSections = sectionsData.filter(s => s.course_id === course.id);
        const courseCompletion = completionsData.find(c => c.course_id === course.id);
        
        const sections: SectionDetail[] = courseSections.map(section => {
          const sectionSubsections = subsectionsData.filter(sub => sub.section_id === section.id);
          
          const subsections: SubsectionDetail[] = sectionSubsections.map(subsection => {
            const subsectionProgress = progressData.find(p => p.subsection_id === subsection.id);
            
            const timeSpent = subsectionProgress?.completed_at && subsectionProgress?.created_at
              ? Math.round((new Date(subsectionProgress.completed_at).getTime() - new Date(subsectionProgress.created_at).getTime()) / (1000 * 60))
              : null;

            return {
              id: subsection.id,
              title: subsection.title,
              subsection_type: subsection.subsection_type as 'content' | 'quiz',
              order_index: subsection.order_index,
              duration_minutes: subsection.duration_minutes,
              progress: subsectionProgress?.progress_percentage || 0,
              started_at: subsectionProgress?.created_at || null,
              completed_at: subsectionProgress?.completed_at || null,
              time_spent_minutes: timeSpent,
            };
          });

          return {
            id: section.id,
            title: section.title,
            order_index: section.order_index,
            subsections,
          };
        });

        // Calculate course progress
        const totalSubsections = sections.reduce((acc, section) => acc + section.subsections.length, 0);
        const completedSubsections = sections.reduce((acc, section) => 
          acc + section.subsections.filter(sub => sub.completed_at).length, 0
        );
        const courseProgress = totalSubsections > 0 ? Math.round((completedSubsections / totalSubsections) * 100) : 0;

        // Find earliest start date
        const allProgress = sections.flatMap(s => s.subsections).map(sub => sub.started_at).filter(Boolean);
        const earliestStart = allProgress.length > 0 ? allProgress.sort()[0] : null;

        return {
          id: course.id,
          title: course.title,
          level: course.level,
          description: course.description,
          is_available: course.is_available,
          progress: courseProgress,
          started_at: earliestStart,
          completed_at: courseCompletion?.completed_at || null,
          sections,
        };
      });

      // Calculate overall stats
      const totalCourses = coursesData.filter(c => c.is_available).length;
      const completedCourses = completionsData.length;
      const totalSubsections = processedCourses.reduce((acc, course) => 
        acc + course.sections.reduce((sAcc, section) => sAcc + section.subsections.length, 0), 0
      );
      const completedSubsections = processedCourses.reduce((acc, course) =>
        acc + course.sections.reduce((sAcc, section) => 
          sAcc + section.subsections.filter(sub => sub.completed_at).length, 0
        ), 0
      );
      const overallProgress = totalSubsections > 0 ? Math.round((completedSubsections / totalSubsections) * 100) : 0;

      // Calculate average completion time
      const completionTimes = processedCourses.flatMap(course =>
        course.sections.flatMap(section =>
          section.subsections.filter(sub => sub.time_spent_minutes).map(sub => sub.time_spent_minutes!)
        )
      );
      const averageCompletionTime = completionTimes.length > 0 
        ? Math.round(completionTimes.reduce((acc, time) => acc + time, 0) / completionTimes.length)
        : 0;

      const userData: UserDetailData = {
        id: userId,
        email: '', // Would need to get from auth if accessible
        created_at: profileData.created_at,
        profile: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          employment_status: profileData.employment_status,
          address_line1: profileData.address_line1,
          address_line2: profileData.address_line2,
          city: profileData.city,
          province_state: profileData.province_state,
          postal_code: profileData.postal_code,
          country: profileData.country,
          phone_number: profileData.phone_number,
          occupation: profileData.occupation,
          service_regions: profileData.service_regions,
          languages_spoken: profileData.languages_spoken,
          avatar_url: profileData.avatar_url,
        },
        role: roleData.role,
        courses: processedCourses,
        overallStats: {
          totalCourses,
          completedCourses,
          totalSubsections,
          completedSubsections,
          overallProgress,
          averageCompletionTime,
        },
      };

      setUserData(userData);
    } catch (error) {
      console.error('Error fetching user detail:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading user details...</span>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground">The requested user could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {userData.profile.first_name} {userData.profile.last_name}
          </h1>
          <p className="text-muted-foreground">User Profile & Learning Progress</p>
        </div>
      </div>

      {/* User Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userData.profile.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {userData.profile.first_name[0]}{userData.profile.last_name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>{userData.profile.first_name} {userData.profile.last_name}</span>
                  </div>

                  {/* Phone Number */}
                  {userData.profile.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span>{userData.profile.phone_number}</span>
                    </div>
                  )}

                  {/* Employment Status */}
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Employment:</span>
                    {userData.profile.employment_status ? (
                      <Badge variant="outline">{userData.profile.employment_status}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </div>

                  {/* Occupation */}
                  {userData.profile.occupation && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Occupation:</span>
                      <Badge variant="secondary">{userData.profile.occupation}</Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Joined:</span>
                    <span>{format(new Date(userData.created_at), 'PPP')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Role:</span>
                    <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                      {userData.role}
                    </Badge>
                  </div>

                  {/* Detailed Address */}
                  {(userData.profile.address_line1 || userData.profile.city || userData.profile.province_state || userData.profile.country) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="font-medium">Address:</span>
                      <span className="text-sm">
                        {userData.profile.address_line1}{userData.profile.address_line2 ? `, ${userData.profile.address_line2}` : ''}<br/>
                        {userData.profile.city}, {userData.profile.province_state} {userData.profile.postal_code}<br/>
                        {userData.profile.country}
                      </span>
                    </div>
                  )}

                  {/* Service Regions */}
                  {userData.profile.service_regions && userData.profile.service_regions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Service Regions:</span>
                      <div className="flex flex-wrap gap-1">
                        {userData.profile.service_regions.map((region, i) => (
                          <Badge key={i} variant="outline">{region}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages Spoken */}
                  {userData.profile.languages_spoken && userData.profile.languages_spoken.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Languages:</span>
                      <div className="flex flex-wrap gap-1">
                        {userData.profile.languages_spoken.map((lang, i) => (
                          <Badge key={i} variant="outline">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Avg. Completion Time:</span>
                    <span>{userData.overallStats.averageCompletionTime} minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Certification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CertificationStatusDisplay userId={userData.id} />
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData.overallStats.completedCourses}/{userData.overallStats.totalCourses}
            </div>
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Subsections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData.overallStats.completedSubsections}/{userData.overallStats.totalSubsections}
            </div>
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.overallStats.overallProgress}%</div>
            <Progress value={userData.overallStats.overallProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.overallStats.averageCompletionTime}</div>
            <p className="text-xs text-muted-foreground">minutes per subsection</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Course Progress Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {userData.courses.map((course) => (
            <div key={course.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">Level {course.level}</p>
                  {course.description && (
                    <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{course.progress}%</div>
                  <Progress value={course.progress} className="h-2 w-24 mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Started:</span>{' '}
                  {course.started_at ? format(new Date(course.started_at), 'PPP') : 'Not started'}
                </div>
                <div>
                  <span className="font-medium">Completed:</span>{' '}
                  {course.completed_at ? format(new Date(course.completed_at), 'PPP') : 'Not completed'}
                </div>
              </div>

              <Separator />

              {/* Sections */}
              <div className="space-y-3">
                {course.sections.map((section) => (
                  <div key={section.id} className="ml-4">
                    <h4 className="font-medium mb-2">{section.title}</h4>
                    <div className="space-y-2">
                      {section.subsections.map((subsection) => (
                        <div key={subsection.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {subsection.completed_at ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">{subsection.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {subsection.subsection_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {subsection.time_spent_minutes && (
                              <span>{subsection.time_spent_minutes}m</span>
                            )}
                            {subsection.completed_at && (
                              <span>
                                {formatDistanceToNow(new Date(subsection.completed_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetail;