"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWaitlistEmails } from '@/actions/waitlist-actions';

function AdminProtectedWaitlist() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAuth = async () => {
      const adminSession = sessionStorage.getItem('admin_session');
      if (adminSession !== 'true') {
        router.push('/admin/login?redirect=/admin/waitlist');
      } else {
        setIsAdminAuthenticated(true);
        await fetchWaitlistEmails();
      }
    };

    checkAdminAuth();
  }, [router]);

  const fetchWaitlistEmails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWaitlistEmails();
      if (result.success) {
        setEmails(result.emails);
      } else {
        setError(result.error || 'Failed to fetch waitlist emails');
      }
    } catch (error) {
      setError('Error fetching waitlist emails');
      console.error('Error fetching waitlist emails:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdminAuthenticated) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Waitlist Emails</h1>
      {isLoading ? (
        <p>Loading emails...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : emails.length > 0 ? (
        <ul className="list-disc pl-5">
          {emails.map((email, index) => (
            <li key={index} className="mb-2">{email}</li>
          ))}
        </ul>
      ) : (
        <p>No emails in the waitlist.</p>
      )}
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <AdminProtectedWaitlist />
    </main>
  );
}