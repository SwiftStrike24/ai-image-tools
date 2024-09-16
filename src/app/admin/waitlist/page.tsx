"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { kv } from "@vercel/kv";

function AdminProtectedWaitlist() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAuth = async () => {
      const adminSession = sessionStorage.getItem('admin_session');
      if (adminSession !== 'true') {
        router.push('/admin/login?redirect=/admin/waitlist');
      } else {
        setIsAdminAuthenticated(true);
        fetchWaitlistEmails();
      }
    };

    checkAdminAuth();
  }, [router]);

  const fetchWaitlistEmails = async () => {
    try {
      const response = await fetch('/api/admin/waitlist');
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails);
      } else {
        console.error('Failed to fetch waitlist emails');
      }
    } catch (error) {
      console.error('Error fetching waitlist emails:', error);
    }
  };

  if (!isAdminAuthenticated) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Waitlist Emails</h1>
      <ul className="list-disc pl-5">
        {emails.map((email, index) => (
          <li key={index} className="mb-2">{email}</li>
        ))}
      </ul>
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