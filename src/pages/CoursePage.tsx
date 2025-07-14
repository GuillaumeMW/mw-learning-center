import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Course, Lesson, Section } from "@/types/course";
import { CourseStructure } from "@/components/CourseStructure";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Users,
  Target
} from "lucide-react";

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(0);
  const [hasStructuredContent, setHasStructuredContent] = useState(false);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    if (!courseId || !user) return;

    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Check if we have sections (new structure)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('id')
        .eq('course_id', courseId)
        .limit(1);

      if (sectionsError && sectionsError.code !== 'PGRST116') {
        throw sectionsError;
      }

      const hasStructure = sectionsData && sectionsData.length > 0;
      setHasStructuredContent(hasStructure);

      if (hasStructure) {
        // Fetch subsections to calculate total count
        const { data: subsectionsData, error: subsectionsError } = await supabase
          .from('subsections')
          .select('id, section_id')
          .in('section_id', await supabase
            .from('sections')
            .select('id')
            .eq('course_id', courseId)
            .then(res => res.data?.map(s => s.id) || [])
          );

        if (subsectionsError && subsectionsError.code !== 'PGRST116') {
          throw subsectionsError;
        }

        // Fetch user progress for subsections
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('subsection_id, completed_at')
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .not('completed_at', 'is', null);

        if (progressError && progressError.code !== 'PGRST116') {
          throw progressError;
        }

        const completed = new Set(progressData?.map(p => p.subsection_id).filter(Boolean) || []);
        setCompletedItems(completed);

        // Calculate progress for sections/subsections
        const totalSubsections = subsectionsData?.length || 0;
        const completedCount = completed.size;
        const progress = totalSubsections > 0 ? Math.round((completedCount / totalSubsections) * 100) : 0;
        setCourseProgress(progress);
      } else {
        // Fallback to old lessons structure
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;
        setLessons(lessonsData || []);

        // Fetch user progress for lessons
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('lesson_id, completed_at')
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .not('completed_at', 'is', null);

        if (progressError && progressError.code !== 'PGRST116') {
          throw progressError;
        }

        const completed = new Set(progressData?.map(p => p.lesson_id).filter(Boolean) || []);
        setCompletedItems(completed);

        // Calculate progress percentage
        const totalLessons = lessonsData?.length || 0;
        const completedCount = completed.size;
        const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
        setCourseProgress(progress);
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = (lessonId: string) => {
    navigate(`/course/${courseId}/lesson/${lessonId}`);
  };

  const getTotalDuration = () => {
    return lessons.reduce((total, lesson) => total + (lesson.duration_minutes || 0), 0);
  };

  const isLessonAccessible = (lessonIndex: number) => {
    if (lessonIndex === 0) return true; // First lesson is always accessible
    
    // Check if previous lesson is completed
    const previousLesson = lessons[lessonIndex - 1];
    return previousLesson ? completedItems.has(previousLesson.id) : false;
  };

  const getTotalItems = () => {
    if (hasStructuredContent) {
      // Calculate total subsections across all sections
      return sections.reduce((total, section) => total + (section.subsections?.length || 0), 0);
    }
    return lessons.length;
  };

  const getCompletedCount = () => {
    return completedItems.size;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-4">Course not found</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  Level {course.level}
                </Badge>
                <Badge variant="secondary">
                  {hasStructuredContent ? 'Structured Course' : `${lessons.length} Lessons`}
                </Badge>
                {!hasStructuredContent && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {getTotalDuration()} min
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              
              {course.description && (
                <p className="text-lg text-muted-foreground mb-6">
                  {course.description}
                </p>
              )}

              {/* Progress Section */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {getCompletedCount()} of {hasStructuredContent ? 'sections' : getTotalItems()} {hasStructuredContent ? 'items' : 'lessons'} completed
                    </span>
                    <span className="text-sm font-medium">{courseProgress}%</span>
                  </div>
                  <Progress value={courseProgress} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Course Overview Stats */}
        {!hasStructuredContent && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="flex items-center p-6">
                <BookOpen className="h-8 w-8 text-primary mr-4" />
                <div>
                  <p className="text-2xl font-bold">{lessons.length}</p>
                  <p className="text-sm text-muted-foreground">Total Lessons</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Clock className="h-8 w-8 text-info mr-4" />
                <div>
                  <p className="text-2xl font-bold">{getTotalDuration()}</p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <CheckCircle className="h-8 w-8 text-success mr-4" />
                <div>
                  <p className="text-2xl font-bold">{completedItems.size}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Content */}
        {hasStructuredContent ? (
          <CourseStructure courseId={courseId!} />
        ) : (
          /* Lessons List - Fallback for old structure */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lessons.map((lesson, index) => {
                const isCompleted = completedItems.has(lesson.id);
                const isAccessible = isLessonAccessible(index);
                
                return (
                  <div key={lesson.id}>
                    <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isAccessible 
                        ? 'hover:bg-accent/50 cursor-pointer' 
                        : 'opacity-60 cursor-not-allowed bg-muted/30'
                    }`}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          isCompleted 
                            ? 'bg-success text-success-foreground' 
                            : isAccessible 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className={`font-medium ${!isAccessible ? 'text-muted-foreground' : ''}`}>
                            {lesson.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.duration_minutes} min
                            </span>
                            {isCompleted && (
                              <Badge variant="outline" className="text-xs text-success border-success">
                                Completed
                              </Badge>
                            )}
                            {!isAccessible && !isCompleted && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Locked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant={isCompleted ? "outline" : "default"}
                        size="sm"
                        onClick={() => isAccessible && handleStartLesson(lesson.id)}
                        disabled={!isAccessible}
                      >
                        {isCompleted ? "Review" : "Start"}
                        <Play className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    
                    {index < lessons.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CoursePage;