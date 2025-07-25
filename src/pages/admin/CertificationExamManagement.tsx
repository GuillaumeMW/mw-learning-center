import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  level: number;
  exam_instructions: string | null;
  exam_url: string | null;
  exam_duration_minutes: number | null;
}

const CertificationExamManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, level, exam_instructions, exam_url, exam_duration_minutes')
        .order('level');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    setSaving(courseId);
    try {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId);

      if (error) throw error;

      setCourses(prev => prev.map(course => 
        course.id === courseId ? { ...course, ...updates } : course
      ));

      toast({
        title: "Success",
        description: "Exam settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update exam settings",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleSave = (course: Course) => {
    updateCourse(course.id, {
      exam_instructions: course.exam_instructions,
      exam_url: course.exam_url,
      exam_duration_minutes: course.exam_duration_minutes,
    });
  };

  const updateCourseState = (courseId: string, field: keyof Course, value: string | number) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId ? { ...course, [field]: value } : course
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Certification Exam Management</h1>
        <p className="text-muted-foreground">
          Manage exam instructions, URLs, and settings for each certification level.
        </p>
      </div>

      <div className="space-y-6">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle>Level {course.level}: {course.title}</CardTitle>
              <CardDescription>
                Configure the certification exam for this level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`url-${course.id}`}>Exam URL (Google Form)</Label>
                <Input
                  id={`url-${course.id}`}
                  value={course.exam_url || ''}
                  onChange={(e) => updateCourseState(course.id, 'exam_url', e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`duration-${course.id}`}>Recommended Duration (minutes)</Label>
                <Input
                  id={`duration-${course.id}`}
                  type="number"
                  value={course.exam_duration_minutes || ''}
                  onChange={(e) => updateCourseState(course.id, 'exam_duration_minutes', parseInt(e.target.value) || 0)}
                  placeholder="45"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`instructions-${course.id}`}>Exam Instructions</Label>
                <Textarea
                  id={`instructions-${course.id}`}
                  value={course.exam_instructions || ''}
                  onChange={(e) => updateCourseState(course.id, 'exam_instructions', e.target.value)}
                  placeholder="Enter instructions for students taking this exam..."
                  rows={6}
                />
              </div>

              <Button 
                onClick={() => handleSave(course)}
                disabled={saving === course.id}
                className="w-full"
              >
                {saving === course.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CertificationExamManagement;