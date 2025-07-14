import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3 
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview and key metrics'
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users and roles'
  },
  {
    name: 'Courses',
    href: '/admin/courses',
    icon: BookOpen,
    description: 'Manage course content'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Progress and completion reports'
  }
];

const AdminNavigation = () => {
  const location = useLocation();

  return (
    <nav className="border-b bg-muted/20">
      <div className="px-6">
        <div className="flex space-x-8">
          {navigationItems.map((item) => {
            const isActive = item.href === '/admin' 
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;