import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenAndGetRole } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const userInfo = await verifyTokenAndGetRole(token);
    if (!userInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token'
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      role: userInfo.role,
      uid: userInfo.uid
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user role'
      },
      { status: 500 }
    );
  }
}
