import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/users';

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return false;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return attempts.count >= MAX_ATTEMPTS;
}

function recordLoginAttempt(ip: string, success: boolean) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
  
  if (success) {
    loginAttempts.delete(ip);
  } else {
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(ip, attempts);
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Check rate limiting
    if (isRateLimited(clientIP)) {
      return NextResponse.json({ 
        error: 'Too many login attempts. Please try again in 15 minutes.' 
      }, { status: 429 });
    }

    const body = await request.json();
    const { username, password } = body;

    // Input validation
    if (!username || !password) {
      recordLoginAttempt(clientIP, false);
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim().toLowerCase();
    
    if (sanitizedUsername.length < 3 || password.length < 6) {
      recordLoginAttempt(clientIP, false);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = await authenticateUser(sanitizedUsername, password);

    if (user) {
      // Successful login
      recordLoginAttempt(clientIP, true);
      
      const response = NextResponse.json({ 
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      });
      
      // Set a secure session cookie with user ID
      response.cookies.set('crm-session', `user-${user.id}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });

      return response;
    } else {
      // Failed login
      recordLoginAttempt(clientIP, false);
      
      // Add slight delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // Don't expose internal errors to client
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}