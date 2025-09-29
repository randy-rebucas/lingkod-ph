import { NextRequest, NextResponse } from 'next/server';
import { WalletServiceServer } from '@/lib/marketplace/wallet-service-server';
import { verifyTokenAndGetRole } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
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

    // Sync wallet with earnings
    await WalletServiceServer.syncWallet(userInfo.uid);

    return NextResponse.json({
      success: true,
      message: 'Wallet synced successfully'
    });
  } catch (error) {
    console.error('Error syncing wallet:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync wallet'
      },
      { status: 500 }
    );
  }
}
