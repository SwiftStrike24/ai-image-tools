"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FluxAIImageGenerator from '@/components/FluxAI-ImageGenerator';

function AdminProtectedGenerator() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAuth = async () => {
      const adminSession = sessionStorage.getItem('admin_session');
      if (adminSession !== 'true') {
        router.push('/admin/login?redirect=/generator');
      } else {
        setIsAdminAuthenticated(true);
      }
    };

    checkAdminAuth();
  }, [router]);

  if (!isAdminAuthenticated) {
    return <div>Checking authentication...</div>;
  }

  return <FluxAIImageGenerator />;
}

export default function GeneratorPage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <AdminProtectedGenerator />
    </main>
  );
}