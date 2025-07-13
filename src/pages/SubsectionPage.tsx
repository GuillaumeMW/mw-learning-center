import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Section, Subsection, UserProgress } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/VideoPlayer";
import { CommentThread } from "@/components/CommentThread";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Play,
  FileText,
  HelpCircle
} from "lucide-react";

export const SubsectionPage = () => {
  const { courseId, subsectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [subsection, setSubsection] = useState<Subsection | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [allSubsections, setAllSubsections] = useState<Subsection[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (subsectionId && courseId) {
      fetchSubsectionData();
    }
  }, [subsectionId, courseId, user]);

  const fetchSubsectionData = async () => {
    try {
      // Fetch current subsection
      const { data: subsectionData, error: subsectionError } = await supabase
        .from('subsections')
        .select('*')
        .eq('id', subsectionId)
        .single();

      if (subsectionError) throw subsectionError;
      setSubsection({
        ...subsectionData,
        subsection_type: subsectionData.subsection_type as 'content' | 'quiz'
      });

      // Fetch section information
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .select('*')
        .eq('id', subsectionData.section_id)
        .single();

      if (sectionError) throw sectionError;
      setSection(sectionData);

      // Fetch all subsections for the course for navigation
      const { data: allSectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('id')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (sectionsError) throw sectionsError;

      const { data: allSubsectionsData, error: allSubsectionsError } = await supabase
        .from('subsections')
        .select('*')
        .in('section_id', allSectionsData.map(s => s.id))
        .order('order_index', { ascending: true });

      if (allSubsectionsError) throw allSubsectionsError;
      setAllSubsections((allSubsectionsData || []).map(subsection => ({
        ...subsection,
        subsection_type: subsection.subsection_type as 'content' | 'quiz'
      })));

      // Check completion status
      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('completed_at')
          .eq('user_id', user.id)
          .eq('subsection_id', subsectionId)
          .maybeSingle();

        if (progressError) throw progressError;
        setIsCompleted(!!progressData?.completed_at);
      }
    } catch (error) {
      console.error('Error fetching subsection data:', error);
      toast({
        title: "Error",
        description: "Failed to load subsection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSubsection = async () => {
    if (!user || !subsection) return;

    setCompleting(true);
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          subsection_id: subsection.id,
          completed_at: new Date().toISOString(),
          progress_percentage: 100,
        });

      if (error) throw error;

      setIsCompleted(true);
      toast({
        title: "Subsection Completed!",
        description: `Great job completing "${subsection.title}"`,
      });
    } catch (error) {
      console.error('Error completing subsection:', error);
      toast({
        title: "Error",
        description: "Failed to mark subsection as complete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const getCurrentSubsectionIndex = () => {
    return allSubsections.findIndex(s => s.id === subsectionId);
  };

  const getNextSubsection = () => {
    const currentIndex = getCurrentSubsectionIndex();
    return currentIndex < allSubsections.length - 1 ? allSubsections[currentIndex + 1] : null;
  };

  const getPreviousSubsection = () => {
    const currentIndex = getCurrentSubsectionIndex();
    return currentIndex > 0 ? allSubsections[currentIndex - 1] : null;
  };

  const handleNextSubsection = () => {
    const next = getNextSubsection();
    if (next) {
      navigate(`/course/${courseId}/subsection/${next.id}`);
    }
  };

  const handlePreviousSubsection = () => {
    const previous = getPreviousSubsection();
    if (previous) {
      navigate(`/course/${courseId}/subsection/${previous.id}`);
    }
  };

  const getSubsectionIcon = () => {
    if (!subsection) return <FileText className="h-5 w-5" />;
    
    if (subsection.subsection_type === 'quiz') {
      return <HelpCircle className="h-5 w-5" />;
    }
    return subsection.video_url ? <Play className="h-5 w-5" /> : <FileText className="h-5 w-5" />;
  };

  const getSubsectionTypeLabel = () => {
    if (!subsection) return 'Content';
    
    if (subsection.subsection_type === 'quiz') {
      return 'Quiz';
    }
    return subsection.video_url ? 'Video Lesson' : 'Reading Material';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subsection...</p>
        </div>
      </div>
    );
  }

  if (!subsection || !section) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Subsection Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The subsection you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate(`/course/${courseId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(`/course/${courseId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{section.title}</Badge>
          <Badge variant={subsection.subsection_type === 'quiz' ? 'destructive' : 'default'}>
            {getSubsectionTypeLabel()}
          </Badge>
          {isCompleted && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-muted-foreground">
        Subsection {getCurrentSubsectionIndex() + 1} of {allSubsections.length}
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getSubsectionIcon()}
            {subsection.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Player */}
          {subsection.video_url && (
            <VideoPlayer
              videoUrl={subsection.video_url}
              onProgress={() => {}}
            />
          )}
          
          {/* Content */}
          {subsection.content && (
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: subsection.content }}
                className="whitespace-pre-wrap"
              />
            </div>
          )}

          {/* Quiz placeholder */}
          {subsection.subsection_type === 'quiz' && (
            <div className="bg-muted p-6 rounded-lg text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Quiz functionality will be implemented here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousSubsection}
          disabled={!getPreviousSubsection()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {!isCompleted && user && (
          <Button onClick={handleCompleteSubsection} disabled={completing}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {completing ? "Marking Complete..." : "Mark as Complete"}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={handleNextSubsection}
          disabled={!getNextSubsection()}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Comments */}
      <CommentThread subsectionId={subsection.id} />
    </div>
  );
};