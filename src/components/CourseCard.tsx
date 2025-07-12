import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Course, CourseStatus } from "@/types/course";
import { Lock, Clock, CheckCircle, Play, ArrowRight } from "lucide-react";

interface CourseCardProps {
  course: Course;
  status: CourseStatus;
  progress?: number;
  onStartCourse?: (courseId: string) => void;
  onContinueCourse?: (courseId: string) => void;
}

const CourseCard = ({ course, status, progress = 0, onStartCourse, onContinueCourse }: CourseCardProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'available':
        return {
          badgeVariant: 'default' as const,
          badgeText: 'Available',
          icon: <Play className="h-4 w-4" />,
          cardClassName: 'border-available hover:shadow-medium transition-all duration-300 hover:-translate-y-1',
          buttonText: 'Start Course',
          buttonVariant: 'default' as const,
          disabled: false
        };
      case 'locked':
        return {
          badgeVariant: 'secondary' as const,
          badgeText: 'Locked',
          icon: <Lock className="h-4 w-4" />,
          cardClassName: 'border-locked bg-muted/30 opacity-60',
          buttonText: 'Complete Previous Level',
          buttonVariant: 'secondary' as const,
          disabled: true
        };
      case 'coming-soon':
        return {
          badgeVariant: 'outline' as const,
          badgeText: 'Coming Soon',
          icon: <Clock className="h-4 w-4" />,
          cardClassName: 'border-coming-soon bg-coming-soon/5',
          buttonText: 'Coming Soon',
          buttonVariant: 'outline' as const,
          disabled: true
        };
      case 'completed':
        return {
          badgeVariant: 'default' as const,
          badgeText: 'Completed',
          icon: <CheckCircle className="h-4 w-4" />,
          cardClassName: 'border-success bg-success/5',
          buttonText: 'Review Course',
          buttonVariant: 'outline' as const,
          disabled: false
        };
    }
  };

  const config = getStatusConfig();

  const handleButtonClick = () => {
    if (config.disabled) return;
    
    if (status === 'completed' || progress > 0) {
      onContinueCourse?.(course.id);
    } else {
      onStartCourse?.(course.id);
    }
  };

  const getLevelBadgeColor = () => {
    const colors = [
      'bg-emerald-100 text-emerald-700',
      'bg-blue-100 text-blue-700', 
      'bg-purple-100 text-purple-700',
      'bg-amber-100 text-amber-700'
    ];
    return colors[(course.level - 1) % colors.length];
  };

  return (
    <Card className={`${config.cardClassName} animate-fade-in`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-xs font-medium ${getLevelBadgeColor()}`}>
              Level {course.level}
            </Badge>
            <Badge variant={config.badgeVariant} className="text-xs">
              <span className="flex items-center gap-1">
                {config.icon}
                {config.badgeText}
              </span>
            </Badge>
          </div>
        </div>
        
        <CardTitle className="text-lg leading-tight">
          {course.title}
        </CardTitle>
        
        {course.description && (
          <CardDescription className="line-clamp-2">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-4">
        {status === 'available' && progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {status === 'locked' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Complete Level {course.level - 1} to unlock</span>
          </div>
        )}
        
        {status === 'coming-soon' && (
          <div className="flex items-center gap-2 text-sm text-coming-soon">
            <Clock className="h-4 w-4" />
            <span>This course is under development</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleButtonClick}
          disabled={config.disabled}
          variant={config.buttonVariant}
          className="w-full group"
        >
          <span>{config.buttonText}</span>
          {!config.disabled && (
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;