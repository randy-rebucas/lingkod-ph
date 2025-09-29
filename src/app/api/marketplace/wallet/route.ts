import { NextRequest, NextResponse } from 'next/server';
import { WalletServiceServer } from '@/lib/marketplace/wallet-service-server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Simple token verification function
async function verifyToken(token: string): Promise<{ uid: string; role: string } | null> {
  try {
    // For development, decode JWT manually
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const uid = payload.uid;
    
    if (!uid) {
      return null;
    }
    
    // Get user data from Firestore
    if (!db) {
      console.error('Firestore not initialized');
      return null;
    }
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    return {
      uid: uid,
      role: userData.role
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

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

    const userInfo = await verifyToken(token);
    if (!userInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token'
        },
        { status: 401 }
      );
    }

    const wallet = await WalletServiceServer.getWallet(userInfo.uid);
    const summary = await WalletServiceServer.getWalletSummary(userInfo.uid);

    return NextResponse.json({
      success: true,
      data: {
        wallet,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch wallet'
      },
      { status: 500 }
    );
  }
}
