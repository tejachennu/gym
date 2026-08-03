'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/Loading';

export default function RootPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userData?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/client');
      }
    }
  }, [user, userData, loading, router]);

  return <PageLoader />;
}
