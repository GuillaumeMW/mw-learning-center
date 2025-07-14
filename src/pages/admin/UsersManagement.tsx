import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, UserCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  profile: {
    first_name: string;
    last_name: string;
    employment_status: string | null;
  } | null;
  role: 'student' | 'admin';
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

  const fetchUsers = async () => {
    try {
      // First get all users with their profiles and roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          employment_status,
          created_at
        `);

      if (profilesError) throw profilesError;

      // Get user roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get user progress data
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          course_id,
          progress_percentage
        `);

      if (progressError) throw progressError;

      // Get course completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('course_completions')
        .select('user_id, course_id');

      if (completionsError) throw completionsError;

      // Get total number of courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id');

      if (coursesError) throw coursesError;

      const totalCourses = coursesData?.length || 0;

      // Process the data
      const usersData: UserData[] = profilesData?.map(profile => {
        const userProgress = progressData?.filter(p => p.user_id === profile.user_id) || [];
        const userCompletions = completionsData?.filter(c => c.user_id === profile.user_id) || [];
        const userRole = rolesData?.find(r => r.user_id === profile.user_id);
        
        // Calculate overall progress
        const totalProgress = userProgress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0);
        const averageProgress = userProgress.length > 0 ? totalProgress / userProgress.length : 0;

        return {
          id: profile.user_id,
          email: '', // We'll get this from auth metadata if needed
          created_at: profile.created_at,
          last_sign_in_at: null, // This would come from auth.users if accessible
          profile: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            employment_status: profile.employment_status,
          },
          role: userRole?.role || 'student',
          course_progress: {
            total_courses: totalCourses,
            completed_courses: userCompletions.length,
            overall_progress: Math.round(averageProgress),
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

  const handleRoleChange = async (userId: string, newRole: 'student' | 'admin') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.role === 'student').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.role === 'admin').length}
            </div>
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
                <TableHead>Name</TableHead>
                <TableHead>Employment Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Course Progress</TableHead>
                <TableHead>Completion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
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
                    {user.profile?.employment_status ? (
                      <Badge variant="outline">
                        {user.profile.employment_status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value: 'student' | 'admin') => 
                        handleRoleChange(user.id, value)
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(user.created_at), { 
                        addSuffix: true 
                      })}
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