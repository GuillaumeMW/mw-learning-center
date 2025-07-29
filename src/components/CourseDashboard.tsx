import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Course, CourseStatus, Section, Subsection } from "@/types/course";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Loader2, GraduationCap, Target, BookOpen, ArrowRight, Lock, FileText, CheckCircle2, Clock, CreditCard, Award } from "lucide-react";
import movingwaldoLogo from "@/assets/movingwaldo-logo.svg";

interface CourseWithNestedContent extends Course {
  sections?: (Section & { subsections?: Subsection[] })[];
  _totalItems: number;
  _hasStructuredContent: boolean;
}

interface CertificationWorkflow {
  id: string;
  current_step: string;
  exam_status: string;
  admin_approval_status: string;
  contract_status: string;
  subscription_status: string;
}

const CourseDashboard = () => {
  const [courses, setCourses] = useState<CourseWithNestedContent[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [certificationWorkflows, setCertificationWorkflows] = useState<Record<number, CertificationWorkflow>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
    fetchUserProgress();
    fetchCertificationWorkflows();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          sections (
            id,
            title,
            order_index,
            subsections (
              id,
              subsection_type,
              duration_minutes
            )
          )
        `)
        .order('level', { ascending: true })
        .order('order_index', { foreignTable: 'sections', ascending: true })
        .order('order_index', { foreignTable: 'sections.subsections', ascending: true });

      if (error) throw error;

      const coursesWithTotals: CourseWithNestedContent[] = (data || []).map(course => {
        let totalItems = 0;
        let hasStructuredContent = false;

        if (course.sections && course.sections.length > 0) {
          hasStructuredContent = true;
          course.sections.forEach(section => {
            if (section.subsections) {
              totalItems += section.subsections.length;
            }
          });
        }

        return {
          ...course,
          sections: course.sections as (Section & { subsections: Subsection[] })[],
          _totalItems: totalItems,
          _hasStructuredContent: hasStructuredContent,
        };
      });

      setCourses(coursesWithTotals);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('course_id, subsection_id, lesson_id, completed_at')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserProgress(data || []);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const fetchCertificationWorkflows = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('certification_workflows')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const workflowsByLevel = data?.reduce((acc, workflow) => {
        acc[workflow.level] = workflow;
        return acc;
      }, {} as Record<number, CertificationWorkflow>) || {};
      
      setCertificationWorkflows(workflowsByLevel);
    } catch (error) {
      console.error('Error fetching certification workflows:', error);
    }
  };

  const getCourseStatus = (course: Course): CourseStatus => {
    // Level 1 is available if marked as available
    if (course.level === 1 && course.is_available) {
      return 'available';
    }
    
    // Other levels are either locked or coming soon
    if (course.level > 1) {
      if (course.is_coming_soon) {
        return 'locked'; // Locked because previous levels need completion
      }
      return 'locked';
    }
    
    // If not available and is coming soon
    if (course.is_coming_soon) {
      return 'coming-soon';
    }
    
    return 'locked';
  };

  const getCurrentCourse = () => {
    // Find the first available course or the first course
    const availableCourse = courses.find(c => getCourseStatus(c) === 'available');
    return availableCourse || courses[0];
  };

  const getCourseProgress = (course: CourseWithNestedContent) => {
    if (!course._totalItems || course._totalItems === 0) {
      return { percentage: 0, completed: 0, total: 0 };
    }

    const completedItemsIds = new Set(userProgress
      .filter(p => p.course_id === course.id && p.completed_at)
      .map(p => p.subsection_id || p.lesson_id)
      .filter(Boolean)
    );

    const completedCount = completedItemsIds.size;
    const totalCount = course._totalItems;

    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return { percentage, completed: completedCount, total: totalCount };
  };

  const hasStartedAnyCourse = () => {
    return userProgress.length > 0;
  };

  const handleStartCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const handleContinueCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const getCertificationStatus = (courseLevel: number) => {
    const workflow = certificationWorkflows[courseLevel];
    if (!workflow) return null;
    
    return {
      status: workflow.current_step,
      examStatus: workflow.exam_status,
      adminApproval: workflow.admin_approval_status,
      contractStatus: workflow.contract_status,
      subscriptionStatus: workflow.subscription_status,
    };
  };

  const getCurrentDashboardState = () => {
    if (!currentCourse || !userProgress.length) return 'new-user';
    
    const workflow = certificationWorkflows[currentCourse.level];
    const courseProgress = getCourseProgress(currentCourse);
    
    if (!workflow) {
      // No workflow yet, check if training is in progress
      return courseProgress.percentage > 0 ? 'training-progress' : 'new-user';
    }
    
    // Check workflow state
    if (workflow.subscription_status === 'active') {
      return 'completed';
    }
    
    if (workflow.contract_status === 'signed') {
      return 'subscription';
    }
    
    if (workflow.admin_approval_status === 'approved') {
      return 'contract';
    }
    
    if (workflow.exam_status === 'passed') {
      return 'contract';
    }
    
    if (courseProgress.percentage === 100) {
      return 'exam';
    }
    
    if (courseProgress.percentage > 0) {
      return 'training-progress';
    }
    
    return 'new-user';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading courses...</span>
        </div>
      </div>
    );
  }

  const currentCourse = getCurrentCourse();
  const courseProgress = currentCourse ? getCourseProgress(currentCourse) : { percentage: 0, completed: 0, total: 0 };
  const dashboardState = getCurrentDashboardState();
  const workflow = currentCourse ? certificationWorkflows[currentCourse.level] : null;

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-12">
      <div className="flex items-center gap-4">
        <img src={movingwaldoLogo} alt="MovingWaldo" className="h-8" />
        <h1 className="text-2xl font-bold text-foreground">MovingWaldo Certification Program</h1>
      </div>
      {profile && (
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <p className="font-semibold">{profile.first_name}!</p>
        </div>
      )}
    </div>
  );

  const renderWorkflowSteps = (currentStep: string, completedSteps: string[] = []) => {
    const steps = [
      { id: 'training', title: 'Training', description: 'Complete the Level 1 training modules', icon: GraduationCap },
      { id: 'exam', title: 'Exam', description: 'Pass the Level 1 exam to proceed.', icon: FileText },
      { id: 'contract', title: 'Contract', description: 'Review and sign the advisor agreement.', icon: Award },
      { id: 'subscription', title: 'Subscription', description: 'Choose a subscription plan to activate your certification.', icon: CreditCard },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          
          return (
            <Card key={step.id} className={`relative ${isCurrent ? 'ring-2 ring-primary' : ''} ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <step.icon className={`h-6 w-6 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {isCompleted && (
                  <CheckCircle2 className="absolute top-4 right-4 h-5 w-5 text-green-600" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderNewUserDashboard = () => (
    <div className="max-w-4xl mx-auto">
      {renderHeader()}
      <div className="text-center mb-12">
        <p className="text-lg text-muted-foreground mb-8">
          Welcome to the MovingWaldo RS Certification Program! This program is designed to equip you with the knowledge and skills needed to become a certified advisor, helping clients coordinate their moves with confidence and expertise.
        </p>
        <Badge variant="outline" className="mb-8 text-sm px-4 py-2">
          <Award className="w-4 h-4 mr-2" />
          CERTIFIED LEVEL 1
        </Badge>
      </div>
      
      <h2 className="text-3xl font-bold text-center mb-8">Level 1 Certification Process</h2>
      
      {renderWorkflowSteps('training')}
      
      <div className="text-center">
        <Button 
          size="lg" 
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
          onClick={() => currentCourse && navigate(`/course/${currentCourse.id}`)}
        >
          Start Level 1 Training
        </Button>
      </div>
    </div>
  );

  const renderTrainingProgressDashboard = () => (
    <div className="max-w-4xl mx-auto">
      {renderHeader()}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Training Level 1</h2>
        <p className="text-lg text-muted-foreground mb-8">Training Progress</p>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold">{courseProgress.percentage}%</span>
          </div>
          <Progress value={courseProgress.percentage} className="h-3 mb-4" />
          <p className="text-muted-foreground">{courseProgress.completed}/{courseProgress.total} subsections completed</p>
        </div>
        
        <Button 
          size="lg" 
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg mb-12"
          onClick={() => currentCourse && navigate(`/course/${currentCourse.id}`)}
        >
          Continue Level 1 Training
        </Button>
      </div>
      
      <h3 className="text-2xl font-bold mb-8">Next Steps</h3>
      {renderWorkflowSteps('training', [])}
    </div>
  );

  const renderExamDashboard = () => (
    <div className="max-w-4xl mx-auto">
      {renderHeader()}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Certification Exam</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Congratulations on completing the training modules! You're now ready to take the Level 1 Exam. This exam assesses your understanding of the material covered in the training and is a crucial step towards becoming a certified MovingWaldo advisor. You have 3 attempts remaining to pass the exam.
        </p>
        
        <Button 
          size="lg" 
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg mb-12"
          onClick={() => navigate(`/certification/${currentCourse?.level}/exam`)}
        >
          Start Certification Exam
        </Button>
      </div>
      
      <h3 className="text-2xl font-bold mb-8">Next Steps</h3>
      {renderWorkflowSteps('exam', ['training'])}
    </div>
  );

  const renderContractDashboard = () => (
    <div className="max-w-4xl mx-auto">
      {renderHeader()}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Certified Relocation Specialist Contract</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Congratulations! You passed the Level 1 Exam! You are now trained and ready to book well planned moves for your clients. To gain access to the live platform and get your certificate, all you need to do now is sign your contract with MovingWaldo and activate your monthly subscription plan.
        </p>
        
        <Button 
          size="lg" 
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg mb-12"
          onClick={() => navigate(`/certification/${currentCourse?.level}/contract`)}
        >
          Sign my Contract
        </Button>
      </div>
      
      <h3 className="text-2xl font-bold mb-8">Next Steps</h3>
      {renderWorkflowSteps('contract', ['training', 'exam'])}
    </div>
  );

  const renderSubscriptionDashboard = () => (
    <div className="max-w-4xl mx-auto">
      {renderHeader()}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Subscription Level 1</h2>
        <p className="text-lg text-muted-foreground mb-8">
          You're all signed up! Activate your subscription plan and start making a difference in your community!
        </p>
        
        <Button 
          size="lg" 
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg mb-12"
          onClick={() => navigate(`/certification/${currentCourse?.level}/payment`)}
        >
          Activate my Subscription
        </Button>
      </div>
      
      <h3 className="text-2xl font-bold mb-8">Next Steps</h3>
      {renderWorkflowSteps('subscription', ['training', 'exam', 'contract'])}
      
      <h3 className="text-2xl font-bold mb-8 mt-12">Completed</h3>
      {renderWorkflowSteps('', ['training', 'exam', 'contract'])}
    </div>
  );

  const renderCompletedDashboard = () => (
    <div className="max-w-4xl mx-auto">
      {renderHeader()}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Congratulations, {profile?.first_name}!</h2>
        <p className="text-lg text-muted-foreground mb-8">
          You've successfully completed all requirements for Level 1 certification. You are now a certified MovingWaldo Relocation Specialist.
        </p>
        
        <div className="bg-white rounded-lg p-8 shadow-sm border mb-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="w-48 h-32 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
              <Award className="w-16 h-16 text-red-600" />
            </div>
            <div className="text-left">
              <Badge className="mb-4">Level 1 Certified</Badge>
              <h3 className="text-xl font-bold mb-2">Start booking moves and earning commissions</h3>
              <p className="text-muted-foreground mb-4">
                Access the standalone platform to begin coordinating moves, managing your business, and maximizing your earning potential.
              </p>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Go to Platform
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold mb-8">Next Steps</h3>
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className="w-32 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold mb-2">Upgrade to Level 2 Certification</h4>
              <p className="text-muted-foreground mb-4">
                Unlock advanced features, higher commission rates, and exclusive benefits by completing the Level 2 certification program.
              </p>
              <Button variant="outline">Learn More</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render based on dashboard state
  switch (dashboardState) {
    case 'training-progress':
      return renderTrainingProgressDashboard();
    case 'exam':
      return renderExamDashboard();
    case 'contract':
      return renderContractDashboard();
    case 'subscription':
      return renderSubscriptionDashboard();
    case 'completed':
      return renderCompletedDashboard();
    default:
      return renderNewUserDashboard();
  }
};

export default CourseDashboard;
