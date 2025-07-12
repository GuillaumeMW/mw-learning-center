import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Course, Lesson } from "@/types/course";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { VideoPlayer } from "@/components/VideoPlayer";
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle, 
  Clock, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play
} from "lucide-react";

const LessonPage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    if (courseId && lessonId && user) {
      fetchLessonData();
    }
  }, [courseId, lessonId, user]);

  const fetchLessonData = async () => {
    if (!courseId || !lessonId || !user) return;

    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch current lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      // Fetch all lessons for navigation
      const { data: allLessonsData, error: allLessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (allLessonsError) throw allLessonsError;

      // Check if lesson is completed
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      setCourse(courseData);
      setLesson(lessonData);
      setAllLessons(allLessonsData || []);
      setIsCompleted(!!progressData?.completed_at);

    } catch (error) {
      console.error('Error fetching lesson data:', error);
      toast({
        title: "Error",
        description: "Failed to load lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!user || !courseId || !lessonId || isCompleted) return;

    setCompleting(true);

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
          progress_percentage: 100
        });

      if (error) throw error;

      setIsCompleted(true);
      
      toast({
        title: "Lesson Completed!",
        description: "Great job! You've completed this lesson.",
      });

      // Check if this completes the course
      const completedLessons = allLessons.filter(l => l.id === lessonId || isCompleted).length + 1;
      if (completedLessons === allLessons.length) {
        // Mark course as completed
        const { error: completionError } = await supabase
          .from('course_completions')
          .upsert({
            user_id: user.id,
            course_id: courseId,
            completed_at: new Date().toISOString()
          });

        if (!completionError) {
          toast({
            title: "🎉 Course Completed!",
            description: "Congratulations! You've completed the entire course.",
          });
        }
      }

    } catch (error) {
      console.error('Error completing lesson:', error);
      toast({
        title: "Error",
        description: "Failed to mark lesson as complete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const getCurrentLessonIndex = () => {
    return allLessons.findIndex(l => l.id === lessonId);
  };

  const getNextLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    return currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  };

  const getPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    return currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  };

  const handleNextLesson = () => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
      navigate(`/course/${courseId}/lesson/${nextLesson.id}`);
    }
  };

  const handlePreviousLesson = () => {
    const prevLesson = getPreviousLesson();
    if (prevLesson) {
      navigate(`/course/${courseId}/lesson/${prevLesson.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!course || !lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-4">Lesson not found</p>
          <Button onClick={() => navigate(`/course/${courseId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  const currentIndex = getCurrentLessonIndex();
  const totalLessons = allLessons.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/course/${courseId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {course.title}
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline">
                Lesson {currentIndex + 1} of {totalLessons}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {lesson.duration_minutes} min
              </Badge>
              {isCompleted && (
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Course Progress</span>
              <span>{currentIndex + 1} / {totalLessons}</span>
            </div>
            <Progress value={((currentIndex + 1) / totalLessons) * 100} className="h-2" />
          </div>
        </div>

        {/* Video Player */}
        {lesson.video_url && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Play className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Video Lesson</h2>
              </div>
              <VideoPlayer
                videoUrl={lesson.video_url}
                onProgress={setVideoProgress}
                onComplete={() => {
                  if (!isCompleted && videoProgress > 80) {
                    handleCompleteLesson();
                  }
                }}
                className="aspect-video"
              />
            </CardContent>
          </Card>
        )}

        {/* Lesson Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: lesson.content?.replace(/\n/g, '<br>').replace(/#{1,6}\s/g, '<h3>').replace(/<h3>/g, '<h3 class="text-xl font-semibold mb-4 mt-6">') || 'No content available' 
              }}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousLesson}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Lesson
          </Button>

          <div className="flex gap-4">
            {!isCompleted && (
              <Button
                onClick={handleCompleteLesson}
                disabled={completing}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                {completing ? "Completing..." : "Mark as Complete"}
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            )}

            <Button
              onClick={handleNextLesson}
              disabled={currentIndex === totalLessons - 1}
            >
              Next Lesson
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Course Completion Message */}
        {isCompleted && currentIndex === totalLessons - 1 && (
          <Card className="mt-8 bg-success/10 border-success">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">🎉 Congratulations!</h3>
              <p className="text-muted-foreground mb-4">
                You've completed all lessons in this course. You're now ready to move on to the next level!
              </p>
              <Button onClick={() => navigate('/')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LessonPage;