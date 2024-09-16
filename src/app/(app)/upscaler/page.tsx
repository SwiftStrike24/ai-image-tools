"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpscaler from '@/components/ImageUpscaler';

function AdminProtectedUpscaler() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAuth = async () => {
      const adminSession = sessionStorage.getItem('admin_session');
      if (adminSession !== 'true') {
        router.push('/admin/login?redirect=/upscaler');
      } else {
        setIsAdminAuthenticated(true);
      }
    };

    checkAdminAuth();
  }, [router]);

  if (!isAdminAuthenticated) {
    return <div>Checking authentication...</div>;
  }

  return <ImageUpscaler />;
}

export default function UpscalerPage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <AdminProtectedUpscaler />
    </main>
  );
}