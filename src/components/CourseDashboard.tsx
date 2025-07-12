import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Course, CourseStatus } from "@/types/course";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CourseCard from "./CourseCard";
import UserMenu from "./UserMenu";
import { Loader2, GraduationCap, Target, BookOpen } from "lucide-react";

const CourseDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
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
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCourseStatus = (course: Course): CourseStatus => {
    // Level 1 is available if marked as available
    if (course.level === 1 && course.is_available) {
      return 'available';
    }
    
    // Other levels are either locked or coming soon
    if (course.level > 1) {
      if (course.is_coming_soon) {
        return 'locked'; // Locked because previous levels need completion
      }
      return 'locked';
    }
    
    // If not available and is coming soon
    if (course.is_coming_soon) {
      return 'coming-soon';
    }
    
    return 'locked';
  };

  const handleStartCourse = (courseId: string) => {
    // TODO: Navigate to course content
    toast({
      title: "Coming Soon",
      description: "Course content will be available soon!",
    });
  };

  const handleContinueCourse = (courseId: string) => {
    // TODO: Navigate to course content
    toast({
      title: "Continue Learning",
      description: "Redirecting to course content...",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading courses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section with User Menu */}
      <div className="flex justify-between items-start">
        <div className="text-center flex-1 space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-primary">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight">
            MW Learning Center
          </h1>
          
          {profile && (
            <p className="text-xl text-primary font-medium">
              Welcome back, {profile.first_name}!
            </p>
          )}
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Master the art of relocation with our comprehensive certification program
          </p>
        </div>

        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="text-center p-6 rounded-lg bg-gradient-secondary">
          <Target className="h-8 w-8 mx-auto mb-3 text-primary" />
          <div className="text-2xl font-bold text-foreground">{courses.length}</div>
          <div className="text-sm text-muted-foreground">Total Courses</div>
        </div>
        
        <div className="text-center p-6 rounded-lg bg-gradient-secondary">
          <BookOpen className="h-8 w-8 mx-auto mb-3 text-available" />
          <div className="text-2xl font-bold text-foreground">
            {courses.filter(c => getCourseStatus(c) === 'available').length}
          </div>
          <div className="text-sm text-muted-foreground">Available Now</div>
        </div>
        
        <div className="text-center p-6 rounded-lg bg-gradient-secondary">
          <GraduationCap className="h-8 w-8 mx-auto mb-3 text-coming-soon" />
          <div className="text-2xl font-bold text-foreground">
            {courses.filter(c => c.is_coming_soon).length}
          </div>
          <div className="text-sm text-muted-foreground">Coming Soon</div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Certification Levels
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <div key={course.id} style={{ animationDelay: `${index * 100}ms` }}>
              <CourseCard
                course={course}
                status={getCourseStatus(course)}
                progress={0} // TODO: Fetch actual progress from database
                onStartCourse={handleStartCourse}
                onContinueCourse={handleContinueCourse}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Learning Path Info */}
      <div className="max-w-4xl mx-auto bg-accent/50 rounded-lg p-6 border border-accent">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Your Learning Path
        </h3>
        <p className="text-muted-foreground mb-4">
          Progress through each level sequentially to build your expertise as a MovingWaldo Relocation Specialist.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-available"></div>
            <span><strong>Available:</strong> Ready to start learning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-locked"></div>
            <span><strong>Locked:</strong> Complete previous levels first</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-coming-soon"></div>
            <span><strong>Coming Soon:</strong> Under development</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDashboard;
