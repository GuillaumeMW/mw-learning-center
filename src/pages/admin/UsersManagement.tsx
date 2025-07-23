import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserData {
  id: string;
  created_at: string;
  profile: {
    first_name: string;
    last_name: string;
  } | null;
  course_progress: {
    total_courses: number;
    completed_courses: number;
    overall_progress: number;
  };
}

const UsersManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      // Fetch user profiles (for name and created_at)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          created_at
        `);

      if (profilesError) throw profilesError;

      // Get user progress data - only completed items
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          course_id,
          subsection_id,
          completed_at
        `)
        .not('completed_at', 'is', null);

      if (progressError) throw progressError;

      // Get all subsections for available courses only
      const { data: availableCoursesData, error: availableCoursesError } = await supabase
        .from('courses')
        .select('id')
        .eq('is_available', true);

      if (availableCoursesError) throw availableCoursesError;

      const availableCourseIds = availableCoursesData?.map(c => c.id) || [];

      // Get subsections for available courses (needed for overall progress calculation)
      const { data: sectionsForSubsections, error: sectionsForSubsectionsError } = await supabase
          .from('sections')
          .select('id')
          .in('course_id', availableCourseIds);

      if (sectionsForSubsectionsError) throw sectionsForSubsectionsError;

      const sectionIdsForSubsections = sectionsForSubsections?.map(s => s.id) || [];

      const { data: subsectionsData, error: subsectionsError } = await supabase
        .from('subsections')
        .select('id, section_id')
        .in('section_id', sectionIdsForSubsections);

      if (subsectionsError) throw subsectionsError;

      const totalAvailableSubsections = subsectionsData?.length || 0;

      // Get course completions for available courses only
      const { data: completionsData, error: completionsError } = await supabase
        .from('course_completions')
        .select('user_id, course_id')
        .in('course_id', availableCourseIds);

      if (completionsError) throw completionsError;

      // Process the data
      const usersData: UserData[] = profilesData?.map(profile => {
        const userProgress = progressData?.filter(p => p.user_id === profile.user_id) || [];
        const userCompletions = completionsData?.filter(c => c.user_id === profile.user_id) || [];

        // Calculate overall progress based on completed subsections in available courses
        const completedSubsections = userProgress.filter(p =>
          p.subsection_id &&
          p.completed_at &&
          availableCourseIds.includes(p.course_id)
        ).length;

        const overallProgress = totalAvailableSubsections > 0
          ? Math.round((completedSubsections / totalAvailableSubsections) * 100)
          : 0;

        return {
          id: profile.user_id,
          created_at: profile.created_at,
          profile: {
            first_name: profile.first_name,
            last_name: profile.last_name,
          },
          course_progress: {
            total_courses: availableCourseIds.length,
            completed_courses: userCompletions.length,
            overall_progress: overallProgress,
          },
        };
      }) || [];

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{users.length} total users</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Current Course Progress</TableHead>
                <TableHead>Completion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                >
                  <TableCell>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true
                      })}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.profile?.first_name} {user.profile?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {user.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{user.course_progress.overall_progress}%</span>
                      </div>
                      <Progress
                        value={user.course_progress.overall_progress}
                        className="h-2"
                      />
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {user.course_progress.completed_courses}/
                        {user.course_progress.total_courses}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Courses completed
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagement;