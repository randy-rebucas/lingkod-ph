'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Get user from Firebase Auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const lastDocId = searchParams.get('lastDocId');
    const type = searchParams.get('type');
    const category = searchParams.get('category');

    if (!getDb()) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Build query
    let q = query(
      collection(getDb(), 'notificationDeliveries'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );

    // Add filters if provided
    if (type) {
      q = query(q, where('type', '==', type));
    }
    if (category) {
      q = query(q, where('category', '==', category));
    }

    // Add pagination if lastDocId is provided
    if (lastDocId) {
      const lastDoc = await getDocs(query(collection(getDb(), 'notificationDeliveries'), where('__name__', '==', lastDocId)));
      if (!lastDoc.empty) {
        q = query(q, startAfter(lastDoc.docs[0]));
      }
    }

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
    }));

    return NextResponse.json({
      success: true,
      notifications,
      hasMore: notifications.length === pageSize,
      lastDocId: notifications.length > 0 ? notifications[notifications.length - 1].id : null
    });

  } catch (error) {
    console.error('Error fetching notification history:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
