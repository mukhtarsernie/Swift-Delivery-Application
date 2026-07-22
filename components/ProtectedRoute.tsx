import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, role }: { children: ReactNode; role?: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (role && user.role !== role) {
        router.push(user.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
      }
    }
  }, [user, loading, role, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading...</p>
      </div>
    );
  }

  if (!user || (role && user.role !== role)) {
    return null;
  }

  return <>{children}</>;
}
