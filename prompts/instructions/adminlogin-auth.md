comprehensive prompt for an advanced AI software engineer to implement the admin authentication feature without modifying the existing Clerk auth setup. Here's the full prompt in markdown format:

```markdown
# Task: Implement Admin Authentication for Specific Routes

## Objective
Implement an additional layer of admin authentication for the `/upscaler` and `/generator` routes in a Next.js application, without modifying the existing Clerk authentication setup.

## Requirements
1. Users must be redirected to an admin login page when accessing `/upscaler` or `/generator` routes, regardless of their Clerk authentication status.
2. After successful admin login, users should be redirected back to their originally requested page.
3. The existing Clerk auth setup must remain intact and unmodified.
4. Use a separate middleware file for admin authentication to avoid conflicts with Clerk.

## Files to Create/Modify

1. `src/adminAuthMiddleware.ts` (new file)
2. `src/app/(app)/upscaler/page.tsx` (modify)
3. `src/app/(app)/generator/page.tsx` (modify)
4. `src/app/api/admin/check-auth/route.ts` (new file)
5. `src/app/api/admin/login/route.ts` (modify if needed)
6. `src/components/AdminLoginForm.tsx` (modify if needed)

## Implementation Steps

1. Create `src/adminAuthMiddleware.ts`:
   - Implement a function to check for admin authentication.
   - If not authenticated, redirect to the admin login page with the original URL as a query parameter.

2. Modify `src/app/(app)/upscaler/page.tsx` and `src/app/(app)/generator/page.tsx`:
   - Wrap the existing components with a new component that checks for admin authentication.
   - Use client-side routing to redirect to the admin login page if not authenticated.

3. Create `src/app/api/admin/check-auth/route.ts`:
   - Implement an API route to check the admin authentication status.
   - Return the authentication status based on the presence of an admin authentication cookie.

4. Review and modify if needed `src/app/api/admin/login/route.ts`:
   - Ensure it correctly sets the admin authentication cookie upon successful login.

5. Review and modify if needed `src/components/AdminLoginForm.tsx`:
   - Make sure it handles the redirect URL properly after successful login.

## Detailed Instructions

### 1. Create `src/adminAuthMiddleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function adminAuthMiddleware(req: NextRequest) {
  const adminAuthenticated = req.cookies.get('admin_authenticated')?.value;

  if (adminAuthenticated !== 'true') {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
```

### 2. Modify `src/app/(app)/upscaler/page.tsx` and `src/app/(app)/generator/page.tsx`

For both files, wrap the existing component with an admin authentication check:

```typescript
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OriginalComponent from '@/components/OriginalComponent'; // Replace with actual component name

function AdminProtectedComponent() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAuth = async () => {
      const response = await fetch('/api/admin/check-auth');
      if (response.ok) {
        setIsAdminAuthenticated(true);
      } else {
        router.push(`/admin/login?redirect=${window.location.pathname}`);
      }
    };

    checkAdminAuth();
  }, [router]);

  if (!isAdminAuthenticated) {
    return <div>Checking authentication...</div>;
  }

  return <OriginalComponent />;
}

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-900">
      <AdminProtectedComponent />
    </main>
  );
}
```

### 3. Create `src/app/api/admin/check-auth/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const adminAuthenticated = cookieStore.get('admin_authenticated');

  if (adminAuthenticated && adminAuthenticated.value === 'true') {
    return NextResponse.json({ authenticated: true });
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
```

### 4. Review and modify if needed `src/app/api/admin/login/route.ts`

Ensure it sets the admin authentication cookie correctly:

```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (password === adminPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_authenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    return response;
  } else {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}
```

### 5. Review and modify if needed `src/components/AdminLoginForm.tsx`

Ensure it handles the redirect URL properly:

```typescript
"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginForm() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const redirectUrl = searchParams?.get('redirect') || '/upscaler';
        router.push(redirectUrl);
      } else {
        toast({
          title: "Login Failed",
          description: "Incorrect admin password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of the component (form JSX)
}
```

## Final Notes

- Ensure that the `ADMIN_PASSWORD` environment variable is set in your `.env.local` file.
- Test the implementation thoroughly to make sure it doesn't interfere with the existing Clerk authentication.
- Consider implementing a logout mechanism for the admin authentication if needed.
- Make sure to handle errors gracefully and provide appropriate feedback to users.

By following these steps, you should be able to implement the additional admin authentication layer for the `/upscaler` and `/generator` routes without modifying the existing Clerk auth setup in `src/middleware.ts`.
```

This prompt provides a comprehensive guide for implementing the admin authentication feature without modifying the existing Clerk auth setup. It includes all the necessary files to create or modify, along with detailed instructions and code snippets for each step.
