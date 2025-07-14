import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Course, Section, Subsection } from '@/types/course';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  BookOpen, 
  FileText, 
  Play,
  HelpCircle,
  GripVertical,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CourseFormData {
  title: string;
  description: string;
  level: number;
  is_available: boolean;
  is_coming_soon: boolean;
}

interface SectionFormData {
  title: string;
  description: string;
  course_id: string;
  order_index: number;
}

const ContentManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [courseForm, setCourseForm] = useState<CourseFormData>({
    title: '',
    description: '',
    level: 1,
    is_available: false,
    is_coming_soon: true
  });

  const [sectionForm, setSectionForm] = useState<SectionFormData>({
    title: '',
    description: '',
    course_id: '',
    order_index: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchSections();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedSection) {
      fetchSubsections();
    }
  }, [selectedSection]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    if (!selectedCourse) return;

    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch sections',
        variant: 'destructive',
      });
    }
  };

  const fetchSubsections = async () => {
    if (!selectedSection) return;

    try {
      const { data, error } = await supabase
        .from('subsections')
        .select('*')
        .eq('section_id', selectedSection)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSubsections((data || []).map(item => ({
        ...item,
        subsection_type: item.subsection_type as 'content' | 'quiz'
      })));
    } catch (error) {
      console.error('Error fetching subsections:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subsections',
        variant: 'destructive',
      });
    }
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(courseForm)
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Course updated successfully' });
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([courseForm]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Course created successfully' });
      }

      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseForm({
        title: '',
        description: '',
        level: 1,
        is_available: false,
        is_coming_soon: true
      });
      fetchData();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Error',
        description: 'Failed to save course',
        variant: 'destructive',
      });
    }
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = {
        ...sectionForm,
        course_id: selectedCourse,
        order_index: sections.length
      };

      if (editingSection) {
        const { error } = await supabase
          .from('sections')
          .update(formData)
          .eq('id', editingSection.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Section updated successfully' });
      } else {
        const { error } = await supabase
          .from('sections')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Section created successfully' });
      }

      setShowSectionForm(false);
      setEditingSection(null);
      setSectionForm({
        title: '',
        description: '',
        course_id: '',
        order_index: 0
      });
      fetchSections();
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: 'Error',
        description: 'Failed to save section',
        variant: 'destructive',
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      level: course.level,
      is_available: course.is_available,
      is_coming_soon: course.is_coming_soon
    });
    setShowCourseForm(true);
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionForm({
      title: section.title,
      description: section.description || '',
      course_id: section.course_id,
      order_index: section.order_index
    });
    setShowSectionForm(true);
  };

  const handleCreateSubsection = () => {
    navigate(`/admin/content/subsection/${selectedSection}`);
  };

  const handleEditSubsection = (subsection: Subsection) => {
    navigate(`/admin/content/subsection/${subsection.section_id}?subsectionId=${subsection.id}`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all sections and subsections.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Course deleted successfully' });
      fetchData();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section? This will also delete all subsections.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Section deleted successfully' });
      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete section',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubsection = async (subsectionId: string) => {
    if (!confirm('Are you sure you want to delete this subsection?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subsections')
        .delete()
        .eq('id', subsectionId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Subsection deleted successfully' });
      fetchSubsections();
    } catch (error) {
      console.error('Error deleting subsection:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subsection',
        variant: 'destructive',
      });
    }
  };

  const toggleCourseAvailability = async (course: Course) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_available: !course.is_available })
        .eq('id', course.id);

      if (error) throw error;
      toast({ 
        title: 'Success', 
        description: `Course ${!course.is_available ? 'published' : 'unpublished'}` 
      });
      fetchData();
    } catch (error) {
      console.error('Error updating course availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course availability',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Content Management</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCourseForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="subsections">Subsections</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Courses ({courses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Badge variant="outline">Level {course.level}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {course.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={course.is_available ? 'default' : 'secondary'}>
                            {course.is_available ? 'Published' : 'Draft'}
                          </Badge>
                          {course.is_coming_soon && (
                            <Badge variant="outline">Coming Soon</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCourseAvailability(course)}
                          >
                            {course.is_available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCourse(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Sections</span>
                <div className="flex items-center gap-2">
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          Level {course.level}: {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => setShowSectionForm(true)}
                    disabled={!selectedCourse}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCourse ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sections.map((section) => (
                      <TableRow key={section.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            {section.order_index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{section.title}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {section.description || 'No description'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSection(section)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSection(section.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a course to view its sections
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subsections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Subsections</span>
                <div className="flex items-center gap-2">
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleCreateSubsection}
                    disabled={!selectedSection}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subsection
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSection ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subsections.map((subsection) => (
                      <TableRow key={subsection.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            {subsection.order_index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{subsection.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {subsection.subsection_type === 'quiz' ? (
                              <HelpCircle className="h-4 w-4" />
                            ) : subsection.video_url ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            <Badge variant={subsection.subsection_type === 'quiz' ? 'destructive' : 'secondary'}>
                              {subsection.subsection_type === 'quiz' ? 'Quiz' : 
                               subsection.video_url ? 'Video' : 'Reading'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {subsection.duration_minutes ? `${subsection.duration_minutes} min` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSubsection(subsection)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubsection(subsection.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a section to view its subsections
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Course Form Dialog */}
      <Dialog open={showCourseForm} onOpenChange={setShowCourseForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCourseSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <Select value={courseForm.level.toString()} onValueChange={(value) => setCourseForm({ ...courseForm, level: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_available"
                  checked={courseForm.is_available}
                  onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_available: checked })}
                />
                <Label htmlFor="is_available">Published</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_coming_soon"
                  checked={courseForm.is_coming_soon}
                  onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_coming_soon: checked })}
                />
                <Label htmlFor="is_coming_soon">Coming Soon</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCourseForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingCourse ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Section Form Dialog */}
      <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Edit Section' : 'Add New Section'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSectionSubmit} className="space-y-4">
            <div>
              <Label htmlFor="section-title">Section Title</Label>
              <Input
                id="section-title"
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="section-description">Description</Label>
              <Textarea
                id="section-description"
                value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowSectionForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingSection ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ContentManagement;