import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/Auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <AuthPage />;
  }

  if (!requireAuth && user) {
    // If user is logged in and we don't require auth (like auth page), redirect to dashboard
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;