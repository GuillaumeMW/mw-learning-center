import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRedirectProps {
  children: React.ReactNode;
}

const AdminRedirect = ({ children }: AdminRedirectProps) => {
  const { userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if we're on the home page and user is admin
    if (!loading && userRole === 'admin' && location.pathname === '/') {
      navigate('/admin', { replace: true });
    }
  }, [userRole, loading, location.pathname, navigate]);

  // Don't render children if we're redirecting an admin from home page
  if (!loading && userRole === 'admin' && location.pathname === '/') {
    return null;
  }

  return <>{children}</>;
};

export default AdminRedirect;