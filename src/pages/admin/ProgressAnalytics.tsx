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
import { Download, Search, Filter, TrendingUp, Users, BookOpen, Award } from 'lucide-react';
import { format } from 'date-fns';

interface ProgressData {
  user_id: string;
  user_name: string;
  user_email: string;
  course_id: string;
  course_title: string;
  course_level: number;
  total_subsections: number;
  completed_subsections: number;
  progress_percentage: number;
  last_activity: string;
  completion_date: string | null;
  employment_status: string;
}

interface AnalyticsStats {
  total_users: number;
  total_courses: number;
  total_completions: number;
  average_completion_rate: number;
  active_users_last_30_days: number;
}

const ProgressAnalytics = () => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [filteredData, setFilteredData] = useState<ProgressData[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    total_users: 0,
    total_courses: 0,
    total_completions: 0,
    average_completion_rate: 0,
    active_users_last_30_days: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employmentFilter, setEmploymentFilter] = useState('all');
  const [courses, setCourses] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchProgressData();
    fetchCourses();
    fetchStats();
  }, []);

  useEffect(() => {
    filterData();
  }, [progressData, searchTerm, courseFilter, statusFilter, employmentFilter]);

  const fetchProgressData = async () => {
    try {
      // Get all progress data
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('user_id, course_id, progress_percentage, completed_at, updated_at')
        .order('updated_at', { ascending: false });

      if (progressError) throw progressError;

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, employment_status');

      if (profilesError) throw profilesError;

      // Get all courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, level');

      if (coursesError) throw coursesError;

      // Get subsection counts for each course
      const { data: subsectionCounts, error: subsectionError } = await supabase
        .from('subsections')
        .select('id, section_id, sections!inner(course_id)');

      if (subsectionError) throw subsectionError;

      // Count subsections per course
      const courseCounts = subsectionCounts.reduce((acc, sub) => {
        const courseId = (sub.sections as any).course_id;
        acc[courseId] = (acc[courseId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get completed subsections for each user/course
      const { data: completedSubsections, error: completedError } = await supabase
        .from('user_progress')
        .select('user_id, course_id, subsection_id')
        .not('completed_at', 'is', null)
        .not('subsection_id', 'is', null);

      if (completedError) throw completedError;

      const userCompletions = completedSubsections.reduce((acc, prog) => {
        const key = `${prog.user_id}-${prog.course_id}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Process the data
      const processedData: ProgressData[] = progressData.map(item => {
        const profile = profiles.find(p => p.user_id === item.user_id);
        const course = courses.find(c => c.id === item.course_id);
        const totalSubsections = courseCounts[item.course_id] || 0;
        const completedSubsections = userCompletions[`${item.user_id}-${item.course_id}`] || 0;
        const actualProgress = totalSubsections > 0 ? (completedSubsections / totalSubsections) * 100 : 0;

        return {
          user_id: item.user_id,
          user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User',
          user_email: 'N/A', // We'll get this separately if needed
          course_id: item.course_id,
          course_title: course?.title || 'Unknown Course',
          course_level: course?.level || 0,
          total_subsections: totalSubsections,
          completed_subsections: completedSubsections,
          progress_percentage: actualProgress,
          last_activity: item.updated_at,
          completion_date: item.completed_at,
          employment_status: profile?.employment_status || 'N/A'
        };
      });

      setProgressData(processedData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch progress data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, level')
        .order('level');

      if (error) throw error;
      setCourses(data);
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

      // Get total completions
      const { count: totalCompletions } = await supabase
        .from('course_completions')
        .select('*', { count: 'exact' });

      // Get active users in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsers } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact' })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      setStats({
        total_users: totalUsers || 0,
        total_courses: totalCourses || 0,
        total_completions: totalCompletions || 0,
        average_completion_rate: totalUsers > 0 ? ((totalCompletions || 0) / totalUsers) * 100 : 0,
        active_users_last_30_days: activeUsers || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterData = () => {
    let filtered = progressData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.course_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(item => item.course_id === courseFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        filtered = filtered.filter(item => item.completion_date !== null);
      } else if (statusFilter === 'in-progress') {
        filtered = filtered.filter(item => item.completion_date === null && item.progress_percentage > 0);
      } else if (statusFilter === 'not-started') {
        filtered = filtered.filter(item => item.progress_percentage === 0);
      }
    }

    // Employment filter
    if (employmentFilter !== 'all') {
      filtered = filtered.filter(item => item.employment_status === employmentFilter);
    }

    setFilteredData(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'User Name',
      'Email',
      'Course',
      'Level',
      'Progress %',
      'Completed Subsections',
      'Total Subsections',
      'Status',
      'Last Activity',
      'Completion Date',
      'Employment Status'
    ];

    const csvData = filteredData.map(item => [
      item.user_name,
      item.user_email,
      item.course_title,
      item.course_level.toString(),
      item.progress_percentage.toFixed(1),
      item.completed_subsections.toString(),
      item.total_subsections.toString(),
      item.completion_date ? 'Completed' : item.progress_percentage > 0 ? 'In Progress' : 'Not Started',
      format(new Date(item.last_activity), 'MMM dd, yyyy'),
      item.completion_date ? format(new Date(item.completion_date), 'MMM dd, yyyy') : 'N/A',
      item.employment_status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `progress_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Successful",
      description: "Progress report has been downloaded",
    });
  };

  const getStatusBadge = (item: ProgressData) => {
    if (item.completion_date) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (item.progress_percentage > 0) {
      return <Badge variant="secondary">In Progress</Badge>;
    } else {
      return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const uniqueEmploymentStatuses = [...new Set(progressData.map(item => item.employment_status))];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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
        <h1 className="text-3xl font-bold">Progress Analytics</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_completions}</div>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users or courses..."
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
              </SelectContent>
            </Select>

            <Select value={employmentFilter} onValueChange={setEmploymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by employment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employment</SelectItem>
                {uniqueEmploymentStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status || 'N/A'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Details ({filteredData.length} records)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Employment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.user_name}</div>
                        <div className="text-sm text-muted-foreground">{item.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.course_title}</div>
                        <div className="text-sm text-muted-foreground">Level {item.course_level}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Progress value={item.progress_percentage} className="flex-1" />
                          <span className="text-sm font-medium">{item.progress_percentage.toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.completed_subsections} / {item.total_subsections} subsections
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(item.last_activity), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.employment_status}</Badge>
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