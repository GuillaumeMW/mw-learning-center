import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Course, CourseStatus, Section, Subsection } from "@/types/course";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CourseCard from "./CourseCard";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Loader2, GraduationCap, Target, BookOpen, ArrowRight, Lock, FileText, CheckCircle2, Clock } from "lucide-react";
import certificateBadge from "@/assets/mw_certificate_l1.png";

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

  const getCertificationCTA = (course: CourseWithNestedContent) => {
    const progress = getCourseProgress(course);
    const certStatus = getCertificationStatus(course.level);
    
    // Course not completed yet
    if (progress.percentage < 100) {
      return null;
    }
    
    // No certification workflow started
    if (!certStatus) {
      return (
        <Button 
          onClick={() => navigate(`/certification/${course.level}/exam`)}
          className="w-full mt-4"
          variant="outline"
        >
          <GraduationCap className="h-4 w-4 mr-2" />
          Start Certification Process
        </Button>
      );
    }
    
    // Handle different workflow steps
    switch (certStatus.status) {
      case 'exam':
        if (certStatus.examStatus === 'pending_submission') {
          return (
            <Button 
              onClick={() => navigate(`/certification/${course.level}/exam`)}
              className="w-full mt-4"
            >
              <FileText className="h-4 w-4 mr-2" />
              Take Certification Exam
            </Button>
          );
        } else if (certStatus.examStatus === 'under_review') {
          return (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Exam Under Review</span>
              </div>
            </div>
          );
        }
        break;
        
      case 'admin_approval':
        if (certStatus.adminApproval === 'pending') {
          return (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Awaiting Admin Approval</span>
              </div>
            </div>
          );
        } else if (certStatus.adminApproval === 'approved') {
          return (
            <Button 
              onClick={() => navigate(`/certification/${course.level}/contract`)}
              className="w-full mt-4"
            >
              <FileText className="h-4 w-4 mr-2" />
              Sign Contract
            </Button>
          );
        }
        break;
        
      case 'contract':
        if (certStatus.contractStatus === 'pending_signature') {
          return (
            <Button 
              onClick={() => navigate(`/certification/${course.level}/contract`)}
              className="w-full mt-4"
            >
              <FileText className="h-4 w-4 mr-2" />
              Sign Contract
            </Button>
          );
        } else if (certStatus.contractStatus === 'signed') {
          return (
            <Button 
              onClick={() => navigate(`/certification/${course.level}/payment`)}
              className="w-full mt-4"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Complete Payment
            </Button>
          );
        }
        break;
        
      case 'payment':
        if (certStatus.subscriptionStatus === 'active') {
          return (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Certification Complete!</span>
              </div>
            </div>
          );
        }
        break;
    }
    
    return null;
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
  const hasStarted = hasStartedAnyCourse();

  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Welcome to MW Learning Center
        </h1>
        
        {profile && (
          <p className="text-2xl text-muted-foreground">
            Hello <span className="text-primary font-medium">{profile.first_name}</span>, ready to continue your journey?
          </p>
        )}
      </div>

      {/* Current Course Section */}
      {currentCourse && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-background to-accent/20 rounded-2xl p-8 border shadow-lg">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Course Info */}
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-sm font-medium">
                    Level {currentCourse.level}
                  </Badge>
                  <h2 className="text-3xl font-bold text-foreground">
                    {currentCourse.title}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {currentCourse.description}
                  </p>
                </div>

                {/* Progress Section */}
                {courseProgress.total > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-foreground" />
                      <span className="text-lg font-semibold text-foreground">Your Progress</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{courseProgress.completed} of {courseProgress.total} items completed</span>
                        <span className="text-lg font-bold text-primary">{courseProgress.percentage}%</span>
                      </div>
                      <Progress value={courseProgress.percentage} className="h-3 bg-muted" />
                    </div>
                  </div>
                )}
                {courseProgress.total === 0 && (
                  <div className="text-muted-foreground">
                    No learning items defined for this course yet.
                  </div>
                )}

                {/* CTA Button */}
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 hover-scale w-full"
                    onClick={() => navigate(`/course/${currentCourse.id}`)}
                  >
                    {courseProgress.completed > 0 ? (
                      <>
                        Resume Course <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    ) : (
                      <>
                        Start Level {currentCourse.level} <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                  
                  {/* Certification CTA */}
                  {getCertificationCTA(currentCourse)}
                </div>
              </div>

              {/* Certificate Badge */}
              <div className="lg:w-80 flex justify-center">
                <div className="relative">
                  <img 
                    src={certificateBadge} 
                    alt={`Level ${currentCourse.level} Certificate`}
                    className="w-full h-auto max-w-sm rounded-2xl shadow-xl"
                  />
                  {courseProgress.percentage === 100 && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-green-600 text-white font-bold px-3 py-1">
                        COMPLETED
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Future Courses Section */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Your Learning Path
          </h2>
          <p className="text-lg text-muted-foreground">
            Complete each level to unlock the next certification
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => {
            const status = getCourseStatus(course);
            const progress = getCourseProgress(course);
            const isCurrentCourse = currentCourse?.id === course.id;
            
            return (
              <div 
                key={course.id} 
                className={`relative bg-card rounded-xl border p-6 transition-all hover:shadow-md ${
                  isCurrentCourse ? 'ring-2 ring-primary/50 bg-primary/5' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Current Course Indicator */}
                {isCurrentCourse && (
                  <div className="absolute -top-3 -right-3">
                    <Badge className="bg-primary text-white font-bold">
                      CURRENT
                    </Badge>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={status === 'available' ? 'default' : 'secondary'}>
                      Level {course.level}
                    </Badge>
                    {status === 'locked' && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  
                  <h3 className="text-xl font-semibold">{course.title}</h3>
                  <p className="text-muted-foreground text-sm">{course.description}</p>
                  
                  {progress.total > 0 && (
                    <div className="space-y-2">
                      <Progress value={progress.percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground">{progress.percentage}% complete</span>
                    </div>
                  )}
                  {progress.total === 0 && (
                    <div className="text-xs text-muted-foreground">No learning items</div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    {status === 'available' && 'Ready to start'}
                    {status === 'locked' && 'Complete previous levels first'}
                    {status === 'coming-soon' && 'Coming soon'}
                  </div>
                  
                  {/* Certification Status */}
                  {progress.percentage === 100 && (
                    <div className="mt-2">
                      {getCertificationCTA(course)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseDashboard;
