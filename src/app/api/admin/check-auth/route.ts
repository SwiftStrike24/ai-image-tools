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