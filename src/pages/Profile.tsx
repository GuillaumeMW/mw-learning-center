import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/Navigation';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, userRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    address: profile?.address || '',
    employment_status: profile?.employment_status || '',
  });

  // Fetch user progress and course completions
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: courseCompletions } = useQuery({
    queryKey: ['course-completions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('course_completions')
        .select(`
          *,
          courses (title, level)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating profile",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    const firstName = profile?.first_name || '';
    const lastName = profile?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const calculateOverallProgress = () => {
    if (!userProgress || userProgress.length === 0) return 0;
    const totalProgress = userProgress.reduce((sum, progress) => sum + (progress.progress_percentage || 0), 0);
    return Math.round(totalProgress / userProgress.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{profile?.first_name} {profile?.last_name}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-1">
                {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="employment_status">Employment Status</Label>
                <Input
                  id="employment_status"
                  value={formData.employment_status}
                  onChange={(e) => handleInputChange('employment_status', e.target.value)}
                  placeholder="e.g., Student, Employed, Unemployed"
                />
              </div>

              <Button 
                onClick={handleUpdateProfile} 
                disabled={isLoading}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Learning Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>Your course progress and achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{calculateOverallProgress()}%</span>
                </div>
                <Progress value={calculateOverallProgress()} className="h-2" />
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Course Completions</h4>
                {courseCompletions && courseCompletions.length > 0 ? (
                  <div className="space-y-2">
                    {courseCompletions.map((completion) => (
                      <div key={completion.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{completion.courses?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Level {completion.courses?.level}
                          </p>
                        </div>
                        <Badge variant="default">Completed</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No courses completed yet</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Current Progress</h4>
                {userProgress && userProgress.length > 0 ? (
                  <div className="space-y-3">
                    {userProgress.slice(0, 3).map((progress) => (
                      <div key={progress.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">
                            Course Progress
                          </p>
                          <span className="text-sm text-muted-foreground">
                            {progress.progress_percentage || 0}%
                          </span>
                        </div>
                        <Progress value={progress.progress_percentage || 0} className="h-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No progress tracked yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;