import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()
  const adminPassword = process.env.ADMIN_PASSWORD

  console.log('Received password:', password);
  console.log('Admin password from env:', adminPassword);

  if (password === adminPassword) {
    console.log('Password match, setting cookies');
    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_authenticated', 'true', {
      httpOnly: true,
      secure: true, // Always use secure in production
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    })
    // Set a session storage item to indicate admin session
    response.headers.append('Set-Cookie', 'admin_session=true; path=/; secure; samesite=strict; max-age=86400');
    response.headers.append('Access-Control-Allow-Origin', '*');
    return response
  } else {
    console.log('Password mismatch');
    return NextResponse.json({ success: false }, { status: 401 })
  }
}