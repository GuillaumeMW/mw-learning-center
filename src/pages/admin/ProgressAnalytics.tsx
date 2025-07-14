import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Download, Search, Filter, TrendingUp, Users, BookOpen, Award, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SectionAnalytics {
  section_id: string;
  section_title: string;
  course_title: string;
  course_level: number;
  total_subsections: number;
  users_started: number;
  users_completed: number;
  completion_rate: number;
  avg_completion_time_hours: number | null;
}

interface CourseAnalytics {
  course_id: string;
  course_title: string;
  course_level: number;
  total_sections: number;
  users_started: number;
  users_completed: number;
  completion_rate: number;
  avg_completion_time_hours: number | null;
}

interface AnalyticsStats {
  total_users: number;
  total_courses: number;
  total_sections: number;
  total_course_completions: number;
  active_users_last_30_days: number;
}

const ProgressAnalytics = () => {
  const [sectionAnalytics, setSectionAnalytics] = useState<SectionAnalytics[]>([]);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [filteredSections, setFilteredSections] = useState<SectionAnalytics[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseAnalytics[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    total_users: 0,
    total_courses: 0,
    total_sections: 0,
    total_course_completions: 0,
    active_users_last_30_days: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [viewType, setViewType] = useState<'sections' | 'courses'>('sections');
  const [courses, setCourses] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
    fetchCourses();
    fetchStats();
  }, []);

  useEffect(() => {
    filterData();
  }, [sectionAnalytics, courseAnalytics, searchTerm, courseFilter, viewType]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch section analytics
      await fetchSectionAnalytics();
      // Fetch course analytics
      await fetchCourseAnalytics();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionAnalytics = async () => {
    // Get all sections with their courses
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select(`
        id,
        title,
        course_id,
        courses!inner(title, level),
        subsections(id)
      `)
      .order('order_index');

    if (sectionsError) throw sectionsError;

    // Get section progress data
    const sectionData: SectionAnalytics[] = [];

    for (const section of sections) {
      const subsectionIds = section.subsections.map((sub: any) => sub.id);
      
      // Get users who started this section (have progress on any subsection)
      const { data: startedUsers, error: startedError } = await supabase
        .from('user_progress')
        .select('user_id, created_at, completed_at')
        .in('subsection_id', subsectionIds);

      if (startedError) throw startedError;

      const uniqueStartedUsers = new Set(startedUsers.map(p => p.user_id));
      
      // Get users who completed ALL subsections in this section
      const { data: completedSubsections, error: completedError } = await supabase
        .from('user_progress')
        .select('user_id, subsection_id, completed_at')
        .in('subsection_id', subsectionIds)
        .not('completed_at', 'is', null);

      if (completedError) throw completedError;

      // Count completed subsections per user
      const userCompletions = completedSubsections.reduce((acc, prog) => {
        if (!acc[prog.user_id]) acc[prog.user_id] = [];
        acc[prog.user_id].push(prog.subsection_id);
        return acc;
      }, {} as Record<string, string[]>);

      // Users who completed ALL subsections in this section
      const completedUsers = Object.keys(userCompletions).filter(
        userId => userCompletions[userId].length === subsectionIds.length
      );

      // Calculate average completion time
      let avgCompletionTime = null;
      if (completedUsers.length > 0) {
        const completionTimes = [];
        for (const userId of completedUsers) {
          const userProgress = startedUsers.filter(p => p.user_id === userId);
          if (userProgress.length > 0) {
            const startTime = new Date(Math.min(...userProgress.map(p => new Date(p.created_at).getTime())));
            const endTime = new Date(Math.max(...userProgress.map(p => new Date(p.completed_at).getTime())));
            const timeDiff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
            completionTimes.push(timeDiff);
          }
        }
        if (completionTimes.length > 0) {
          avgCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
        }
      }

      sectionData.push({
        section_id: section.id,
        section_title: section.title,
        course_title: (section.courses as any).title,
        course_level: (section.courses as any).level,
        total_subsections: subsectionIds.length,
        users_started: uniqueStartedUsers.size,
        users_completed: completedUsers.length,
        completion_rate: uniqueStartedUsers.size > 0 ? (completedUsers.length / uniqueStartedUsers.size) * 100 : 0,
        avg_completion_time_hours: avgCompletionTime
      });
    }

    setSectionAnalytics(sectionData);
  };

  const fetchCourseAnalytics = async () => {
    // Get all courses with their sections
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        level,
        sections(id)
      `)
      .order('level');

    if (coursesError) throw coursesError;

    const courseData: CourseAnalytics[] = [];

    for (const course of courses) {
      // Get users who started this course (have any progress)
      const { data: startedUsers, error: startedError } = await supabase
        .from('user_progress')
        .select('user_id, created_at')
        .eq('course_id', course.id);

      if (startedError) throw startedError;

      const uniqueStartedUsers = new Set(startedUsers.map(p => p.user_id));

      // Get users who completed this course
      const { data: completedUsers, error: completedError } = await supabase
        .from('course_completions')
        .select('user_id, completed_at')
        .eq('course_id', course.id);

      if (completedError) throw completedError;

      // Calculate average completion time for completed users
      let avgCompletionTime = null;
      if (completedUsers.length > 0) {
        const completionTimes = [];
        for (const completion of completedUsers) {
          const userStarted = startedUsers.find(p => p.user_id === completion.user_id);
          if (userStarted) {
            const startTime = new Date(userStarted.created_at);
            const endTime = new Date(completion.completed_at);
            const timeDiff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
            completionTimes.push(timeDiff);
          }
        }
        if (completionTimes.length > 0) {
          avgCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
        }
      }

      courseData.push({
        course_id: course.id,
        course_title: course.title,
        course_level: course.level,
        total_sections: course.sections.length,
        users_started: uniqueStartedUsers.size,
        users_completed: completedUsers.length,
        completion_rate: uniqueStartedUsers.size > 0 ? (completedUsers.length / uniqueStartedUsers.size) * 100 : 0,
        avg_completion_time_hours: avgCompletionTime
      });
    }

    setCourseAnalytics(courseData);
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, level')
        .order('level');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Get total courses
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact' });

      // Get total sections
      const { count: totalSections } = await supabase
        .from('sections')
        .select('*', { count: 'exact' });

      // Get total course completions
      const { count: totalCompletions } = await supabase
        .from('course_completions')
        .select('*', { count: 'exact' });

      // Get active users in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeUsersData } = await supabase
        .from('user_progress')
        .select('user_id')
        .gte('updated_at', thirtyDaysAgo.toISOString());

      const activeUsers = new Set(activeUsersData?.map(item => item.user_id) || []).size;

      setStats({
        total_users: totalUsers || 0,
        total_courses: totalCourses || 0,
        total_sections: totalSections || 0,
        total_course_completions: totalCompletions || 0,
        active_users_last_30_days: activeUsers
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterData = () => {
    if (viewType === 'sections') {
      let filtered = sectionAnalytics;

      if (searchTerm) {
        filtered = filtered.filter(item =>
          item.section_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.course_title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (courseFilter !== 'all') {
        filtered = filtered.filter(item => 
          courses.find(c => c.id === courseFilter)?.title === item.course_title
        );
      }

      setFilteredSections(filtered);
    } else {
      let filtered = courseAnalytics;

      if (searchTerm) {
        filtered = filtered.filter(item =>
          item.course_title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (courseFilter !== 'all') {
        filtered = filtered.filter(item => item.course_id === courseFilter);
      }

      setFilteredCourses(filtered);
    }
  };

  const exportToCSV = () => {
    const currentData = viewType === 'sections' ? filteredSections : filteredCourses;
    
    const headers = viewType === 'sections' 
      ? ['Section', 'Course', 'Level', 'Total Subsections', 'Users Started', 'Users Completed', 'Completion Rate %', 'Avg Completion Time (Hours)']
      : ['Course', 'Level', 'Total Sections', 'Users Started', 'Users Completed', 'Completion Rate %', 'Avg Completion Time (Hours)'];

    const csvData = currentData.map(item => 
      viewType === 'sections' ? [
        (item as SectionAnalytics).section_title,
        item.course_title,
        item.course_level.toString(),
        (item as SectionAnalytics).total_subsections.toString(),
        item.users_started.toString(),
        item.users_completed.toString(),
        item.completion_rate.toFixed(1),
        item.avg_completion_time_hours ? item.avg_completion_time_hours.toFixed(1) : 'N/A'
      ] : [
        item.course_title,
        item.course_level.toString(),
        (item as CourseAnalytics).total_sections.toString(),
        item.users_started.toString(),
        item.users_completed.toString(),
        item.completion_rate.toFixed(1),
        item.avg_completion_time_hours ? item.avg_completion_time_hours.toFixed(1) : 'N/A'
      ]
    );

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${viewType}_analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Successful",
      description: `${viewType} analytics has been downloaded`,
    });
  };

  const formatTime = (hours: number | null) => {
    if (!hours) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    return `${hours.toFixed(1)} hours`;
  };

  const currentData = viewType === 'sections' ? filteredSections : filteredCourses;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_courses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_sections}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Completions</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_course_completions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_users_last_30_days}</div>
          </CardContent>
        </Card>
      </div>

      {/* View Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>View Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={viewType === 'sections' ? 'default' : 'outline'}
              onClick={() => setViewType('sections')}
            >
              Section Analytics
            </Button>
            <Button
              variant={viewType === 'courses' ? 'default' : 'outline'}
              onClick={() => setViewType('courses')}
            >
              Course Analytics
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${viewType}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    Level {course.level}: {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewType === 'sections' ? 'Section' : 'Course'} Analytics ({currentData.length} {viewType})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{viewType === 'sections' ? 'Section' : 'Course'}</TableHead>
                  {viewType === 'sections' && <TableHead>Course</TableHead>}
                  <TableHead>Level</TableHead>
                  <TableHead>{viewType === 'sections' ? 'Subsections' : 'Sections'}</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Avg Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">
                        {viewType === 'sections' ? (item as SectionAnalytics).section_title : item.course_title}
                      </div>
                    </TableCell>
                    {viewType === 'sections' && (
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{item.course_title}</div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline">Level {item.course_level}</Badge>
                    </TableCell>
                    <TableCell>
                      {viewType === 'sections' ? (item as SectionAnalytics).total_subsections : (item as CourseAnalytics).total_sections}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {item.users_started}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        {item.users_completed}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={item.completion_rate} className="flex-1 max-w-[100px]" />
                        <span className="text-sm font-medium">{item.completion_rate.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatTime(item.avg_completion_time_hours)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressAnalytics;