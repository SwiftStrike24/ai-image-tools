import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (password === adminPassword) {
    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_authenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    })
    // Set a session storage item to indicate admin session
    response.headers.append('Set-Cookie', 'admin_session=true; path=/; samesite=strict; max-age=86400');
    return response
  } else {
    return NextResponse.json({ success: false }, { status: 401 })
  }
}