import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';


const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, userRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone_number: profile?.phone_number || '',
    address_line1: profile?.address_line1 || '',
    address_line2: profile?.address_line2 || '',
    city: profile?.city || '',
    province_state: profile?.province_state || '',
    postal_code: profile?.postal_code || '',
    country: profile?.country || 'Canada',
    employment_status: profile?.employment_status || 'other',
    occupation: profile?.occupation || 'None of the Above – Other',
    service_regions: profile?.service_regions || [],
    languages_spoken: profile?.languages_spoken || [],
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

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field: string, value: string) => {
    // Convert comma-separated string to array
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setFormData(prev => ({ ...prev, [field]: arrayValue }));
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          province_state: formData.province_state,
          postal_code: formData.postal_code,
          country: formData.country,
          employment_status: formData.employment_status as 'employed' | 'self_employed' | 'student' | 'unemployed' | 'other',
          occupation: formData.occupation,
          service_regions: formData.service_regions,
          languages_spoken: formData.languages_spoken,
        })
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
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="e.g., (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) => handleInputChange('address_line1', e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <div>
                <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) => handleInputChange('address_line2', e.target.value)}
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="province_state">Province/State</Label>
                  <Input
                    id="province_state"
                    value={formData.province_state}
                    onChange={(e) => handleInputChange('province_state', e.target.value)}
                    placeholder="Province/State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="Postal Code"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="employment_status">Employment Status</Label>
                <Select value={formData.employment_status} onValueChange={(value) => handleInputChange('employment_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Select value={formData.occupation} onValueChange={(value) => handleInputChange('occupation', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Real Estate Agent">Real Estate Agent</SelectItem>
                    <SelectItem value="Mortgage Broker">Mortgage Broker</SelectItem>
                    <SelectItem value="Home Stager">Home Stager</SelectItem>
                    <SelectItem value="Property Manager">Property Manager</SelectItem>
                    <SelectItem value="Insurance Broker">Insurance Broker</SelectItem>
                    <SelectItem value="Interior Designer">Interior Designer</SelectItem>
                    <SelectItem value="Professional Organizer">Professional Organizer</SelectItem>
                    <SelectItem value="Concierge / Lifestyle Manager">Concierge / Lifestyle Manager</SelectItem>
                    <SelectItem value="Virtual Assistant">Virtual Assistant</SelectItem>
                    <SelectItem value="Customer Service Representative">Customer Service Representative</SelectItem>
                    <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                    <SelectItem value="Freelancer / Self-Employed">Freelancer / Self-Employed</SelectItem>
                    <SelectItem value="Relocation Specialist / Retired Mover">Relocation Specialist / Retired Mover</SelectItem>
                    <SelectItem value="Retired Professional">Retired Professional</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Stay-at-Home Parent">Stay-at-Home Parent</SelectItem>
                    <SelectItem value="Hospitality Worker (e.g., hotel, Airbnb host)">Hospitality Worker (e.g., hotel, Airbnb host)</SelectItem>
                    <SelectItem value="Event Planner">Event Planner</SelectItem>
                    <SelectItem value="Social Worker / Community Support">Social Worker / Community Support</SelectItem>
                    <SelectItem value="Construction / Renovation Worker">Construction / Renovation Worker</SelectItem>
                    <SelectItem value="None of the Above – Other">None of the Above – Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service_regions">Service Regions</Label>
                <Textarea
                  id="service_regions"
                  value={Array.isArray(formData.service_regions) ? formData.service_regions.join(', ') : ''}
                  onChange={(e) => handleArrayInputChange('service_regions', e.target.value)}
                  placeholder="Enter cities/regions separated by commas (e.g., Toronto, Montreal, Vancouver)"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="languages_spoken">Languages Spoken</Label>
                <Textarea
                  id="languages_spoken"
                  value={Array.isArray(formData.languages_spoken) ? formData.languages_spoken.join(', ') : ''}
                  onChange={(e) => handleArrayInputChange('languages_spoken', e.target.value)}
                  placeholder="Enter languages separated by commas (e.g., English, French, Spanish)"
                  rows={2}
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
  );
};

export default Profile;