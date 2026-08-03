'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/Loading';

export default function CheckinsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/monitoring');
  }, [router]);

  return <PageLoader />;
}
