import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubsectionAttachment } from '@/types/course';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { PDFAttachmentManager } from '@/components/admin/PDFAttachmentManager';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  Play, 
  HelpCircle,
  Loader2,
  BookOpen
} from 'lucide-react';

interface SubsectionFormData {
  title: string;
  content: string;
  video_url: string;
  quiz_url: string;
  quiz_height: number;
  section_id: string;
  subsection_type: 'content' | 'quiz';
  order_index: number;
  duration_minutes: number;
}

interface SectionInfo {
  id: string;
  title: string;
  course_id: string;
  course_title: string;
  course_level: number;
}

const SubsectionEditor = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionInfo, setSectionInfo] = useState<SectionInfo | null>(null);
  const [existingSubsections, setExistingSubsections] = useState<number>(0);
  const [attachments, setAttachments] = useState<SubsectionAttachment[]>([]);
  
  // Get subsection ID from search params for editing
  const subsectionId = searchParams.get('subsectionId');
  const isEditing = Boolean(subsectionId);

  const [formData, setFormData] = useState<SubsectionFormData>({
    title: '',
    content: '',
    video_url: '',
    quiz_url: '',
    quiz_height: 800,
    section_id: sectionId || '',
    subsection_type: 'content',
    order_index: 0,
    duration_minutes: 0
  });

  useEffect(() => {
    if (sectionId) {
      fetchSectionInfo();
      fetchExistingSubsections();
      if (subsectionId) {
        fetchSubsectionData();
      }
    }
  }, [sectionId, subsectionId]);

  const fetchSectionInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select(`
          id,
          title,
          course_id,
          courses (
            id,
            title,
            level
          )
        `)
        .eq('id', sectionId)
        .single();

      if (error) throw error;
      
      setSectionInfo({
        id: data.id,
        title: data.title,
        course_id: data.course_id,
        course_title: data.courses.title,
        course_level: data.courses.level
      });
    } catch (error) {
      console.error('Error fetching section info:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch section information',
        variant: 'destructive',
      });
    }
  };

  const fetchExistingSubsections = async () => {
    try {
      const { data, error } = await supabase
        .from('subsections')
        .select('order_index')
        .eq('section_id', sectionId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      // Get the highest order_index and add 1 for the new subsection
      const maxOrderIndex = data?.[0]?.order_index ?? -1;
      setExistingSubsections(maxOrderIndex + 1);
    } catch (error) {
      console.error('Error fetching existing subsections:', error);
      setExistingSubsections(0);
    }
  };

  const fetchSubsectionData = async () => {
    try {
      const { data, error } = await supabase
        .from('subsections')
        .select('*')
        .eq('id', subsectionId)
        .single();

      if (error) throw error;
      
      setFormData({
        title: data.title,
        content: data.content || '',
        video_url: data.video_url || '',
        quiz_url: data.quiz_url || '',
        quiz_height: data.quiz_height || 800,
        section_id: data.section_id,
        subsection_type: data.subsection_type as 'content' | 'quiz',
        order_index: data.order_index,
        duration_minutes: data.duration_minutes || 0
      });

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('subsection_attachments')
        .select('*')
        .eq('subsection_id', subsectionId)
        .order('created_at', { ascending: true });

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);
    } catch (error) {
      console.error('Error fetching subsection data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subsection data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEditing && sectionInfo) {
      setLoading(false);
    }
  }, [isEditing, sectionInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const submitData = {
        ...formData,
        section_id: sectionId,
        order_index: isEditing ? formData.order_index : existingSubsections
      };

      if (isEditing) {
        const { error } = await supabase
          .from('subsections')
          .update(submitData)
          .eq('id', subsectionId);

        if (error) throw error;
        toast({ title: 'Success', description: 'Subsection updated successfully' });
      } else {
        const { error } = await supabase
          .from('subsections')
          .insert([submitData]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Subsection created successfully' });
      }

      // Navigate back with proper context
      const returnTab = searchParams.get('returnTab');
      const returnCourse = searchParams.get('returnCourse');
      const returnSection = searchParams.get('returnSection');
      
      if (returnTab && returnCourse && returnSection) {
        navigate(`/admin/content?tab=${returnTab}&course=${returnCourse}&section=${returnSection}`);
      } else if (returnTab && returnCourse) {
        navigate(`/admin/content?tab=${returnTab}&course=${returnCourse}`);
      } else {
        navigate('/admin/content');
      }
    } catch (error) {
      console.error('Error saving subsection:', error);
      toast({
        title: 'Error',
        description: 'Failed to save subsection',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Navigate back with proper context
    const returnTab = searchParams.get('returnTab');
    const returnCourse = searchParams.get('returnCourse');
    const returnSection = searchParams.get('returnSection');
    
    if (returnTab && returnCourse && returnSection) {
      navigate(`/admin/content?tab=${returnTab}&course=${returnCourse}&section=${returnSection}`);
    } else if (returnTab && returnCourse) {
      navigate(`/admin/content?tab=${returnTab}&course=${returnCourse}`);
    } else {
      navigate('/admin/content');
    }
  };

  const getSubsectionIcon = () => {
    if (formData.subsection_type === 'quiz') {
      return <HelpCircle className="h-5 w-5" />;
    }
    return formData.video_url ? <Play className="h-5 w-5" /> : <FileText className="h-5 w-5" />;
  };

  const getSubsectionTypeLabel = () => {
    if (formData.subsection_type === 'quiz') {
      return 'Quiz';
    }
    return formData.video_url ? 'Video Content' : 'Reading Content';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!sectionInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Section not found</h2>
          <p className="text-muted-foreground">The requested section could not be found.</p>
          <Button onClick={handleCancel} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Content
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Subsection' : 'Create New Subsection'}
          </h1>
          <p className="text-muted-foreground">
            Course: Level {sectionInfo.course_level} - {sectionInfo.course_title} → {sectionInfo.title}
          </p>
        </div>
      </div>

      {/* Context Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Context Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Course</Label>
              <p className="text-sm text-muted-foreground">
                Level {sectionInfo.course_level}: {sectionInfo.course_title}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Section</Label>
              <p className="text-sm text-muted-foreground">{sectionInfo.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Preview</Label>
              <div className="flex items-center gap-2">
                {getSubsectionIcon()}
                <Badge variant={formData.subsection_type === 'quiz' ? 'destructive' : 'secondary'}>
                  {getSubsectionTypeLabel()}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Subsection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Subsection Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter subsection title"
                required
              />
            </div>

            {/* Type and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={formData.subsection_type} 
                  onValueChange={(value: 'content' | 'quiz') => 
                    setFormData({ ...formData, subsection_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  placeholder="Expected duration"
                />
              </div>
            </div>

            <Separator />

            {/* Video URL */}
            <div>
              <Label htmlFor="video-url">Video URL (optional)</Label>
              <Input
                id="video-url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add a video URL to make this a video-based subsection. Leave empty for text-only content.
              </p>
            </div>

            {/* Quiz URL and Height - Only show for quiz type */}
            {formData.subsection_type === 'quiz' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quiz-url">Quiz URL *</Label>
                  <Input
                    id="quiz-url"
                    value={formData.quiz_url}
                    onChange={(e) => setFormData({ ...formData, quiz_url: e.target.value })}
                    placeholder="https://docs.google.com/forms/d/e/..."
                    required={formData.subsection_type === 'quiz'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the Google Form URL or other quiz platform URL. This will be embedded as an iframe for students to complete.
                  </p>
                </div>
                <div>
                  <Label htmlFor="quiz-height">Quiz Height (pixels) *</Label>
                  <Input
                    id="quiz-height"
                    type="number"
                    min="400"
                    max="5000"
                    value={formData.quiz_height}
                    onChange={(e) => setFormData({ ...formData, quiz_height: parseInt(e.target.value) || 800 })}
                    placeholder="2808"
                    required={formData.subsection_type === 'quiz'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Go to your Google Form → Send → Embed HTML → Copy the height value shown (e.g., 2808 px) and paste it here.
                  </p>
                </div>
              </div>
            )}

            {/* Content */}
            <div>
              <Label htmlFor="content">Content</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Enter the main content for this subsection. This can include instructions, explanations, formatting, links, and any additional information..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use the toolbar above to format your content with headings, lists, links, and more.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Subsection' : 'Create Subsection'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* PDF Attachments - Only show for existing subsections */}
      {isEditing && subsectionId && (
        <PDFAttachmentManager
          subsectionId={subsectionId}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
        />
      )}
    </div>
  );
};

export default SubsectionEditor;