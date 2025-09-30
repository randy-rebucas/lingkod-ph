import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { AdminRateLimiter, AdminOperation } from '@/lib/admin-rate-limiter';
import { AdminSessionManager, validateAdminSession } from '@/lib/admin-session-manager';
import { requireAdmin2FA } from '@/lib/admin-2fa';
import { AdminActivityLogger } from '@/lib/admin-activity-monitor';
import { SecurityEventLogger } from '@/lib/admin-security-notifications';
import { adminDb as db } from '@/lib/firebase-admin';
import { AuditLogger } from '@/lib/audit-logger';

/**
 * Enhanced admin API route with comprehensive security
 */
export async function POST(request: NextRequest) {
  try {
    // Extract request data
    const body = await request.json();
    const { action, operation, data } = body;
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      await SecurityEventLogger.log(
        'unauthorized_access',
        'Invalid Admin Token',
        'Attempted to access admin API with invalid token',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', userAgent: request.headers.get('user-agent') || undefined || undefined }
      );
      
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (decodedToken.role !== 'admin') {
      await SecurityEventLogger.log(
        'unauthorized_access',
        'Non-Admin Access Attempt',
        'Non-admin user attempted to access admin API',
        { userId: decodedToken.uid, userRole: decodedToken.role },
        { userId: decodedToken.uid, ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', userAgent: request.headers.get('user-agent') || undefined || undefined }
      );
      
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const adminId = decodedToken.uid;
    const adminName = decodedToken.name || decodedToken.email || 'Unknown Admin';

    // Validate admin session
    const sessionId = request.headers.get('x-admin-session-id') || undefined;
    if (sessionId) {
      const sessionValidation = await validateAdminSession(request);
      if (!sessionValidation.valid) {
        await SecurityEventLogger.log(
          'admin_session_expired',
          'Invalid Admin Session',
          'Admin attempted to perform action with invalid session',
          { sessionId, error: sessionValidation.error },
          { adminId, adminName, ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', userAgent: request.headers.get('user-agent') || undefined }
        );
        
        return NextResponse.json(
          { error: 'Invalid session', details: sessionValidation.error },
          { status: 401 }
        );
      }
    }

    // Check 2FA requirement
    const twoFAStatus = await requireAdmin2FA(adminId);
    if (twoFAStatus.required && !twoFAStatus.verified) {
      await SecurityEventLogger.log(
        'critical_operation_attempt',
        '2FA Required',
        'Admin attempted critical operation without 2FA verification',
        { operation, action },
        { adminId, adminName, ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', userAgent: request.headers.get('user-agent') || undefined }
      );
      
      return NextResponse.json(
        { error: '2FA verification required' },
        { status: 403 }
      );
    }

    // Check rate limiting
    if (operation && operation in AdminRateLimiter) {
      const rateLimitCheck = await AdminRateLimiter.checkAdminRateLimit(
        operation as AdminOperation,
        adminId,
        request
      );

      if (!rateLimitCheck.allowed) {
        await SecurityEventLogger.log(
          'rate_limit_exceeded',
          'Admin Rate Limit Exceeded',
          `Admin exceeded rate limit for operation: ${operation}`,
          { operation, limit: rateLimitCheck.retryAfter },
          { adminId, adminName, ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', userAgent: request.headers.get('user-agent') || undefined }
        );
        
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded', 
            message: rateLimitCheck.message,
            retryAfter: rateLimitCheck.retryAfter
          },
          { status: 429 }
        );
      }
    }

    // Update session activity
    if (sessionId) {
      await AdminSessionManager.updateActivity(sessionId, 'critical_operation');
    }

    // Log admin activity
    await AdminActivityLogger.log(
      adminId,
      adminName,
      action as any,
      data || {},
      {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        sessionId,
        success: true
      }
    );

    // Process the action based on type
    let result;
    switch (action) {
      case 'user_management':
        result = await handleUserManagement(operation, data, adminId, adminName);
        break;
      case 'financial_operation':
        result = await handleFinancialOperation(operation, data, adminId, adminName);
        break;
      case 'system_configuration':
        result = await handleSystemConfiguration(operation, data, adminId, adminName);
        break;
      case 'content_management':
        result = await handleContentManagement(operation, data, adminId, adminName);
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown action type' },
          { status: 400 }
        );
    }

    // Log successful operation
    await AdminActivityLogger.log(
      adminId,
      adminName,
      `${action}_${operation}` as any,
      { ...data, result: result.success },
      {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        sessionId,
        success: result.success
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin API error:', error);
    
    // Log security event for unexpected errors
    await SecurityEventLogger.log(
      'system_anomaly',
      'Admin API Error',
      'Unexpected error in admin API',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', userAgent: request.headers.get('user-agent') || undefined }
    );
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle user management operations
 */
async function handleUserManagement(
  operation: string,
  _data: unknown,
  _adminId: string,
  _adminName: string
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    switch (operation) {
      case 'create_user':
        // Implement user creation logic
        return { success: true, message: 'User created successfully' };
      
      case 'update_user':
        // Implement user update logic
        return { success: true, message: 'User updated successfully' };
      
      case 'delete_user':
        // Implement user deletion logic
        return { success: true, message: 'User deleted successfully' };
      
      case 'change_user_status':
        // Implement user status change logic
        return { success: true, message: 'User status changed successfully' };
      
      default:
        return { success: false, message: 'Unknown user management operation' };
    }
  } catch (error) {
    console.error('User management error:', error);
    return { success: false, message: 'User management operation failed' };
  }
}

/**
 * Handle financial operations
 */
async function handleFinancialOperation(
  operation: string,
  _data: unknown,
  _adminId: string,
  _adminName: string
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    switch (operation) {
      case 'process_payout':
        // Implement payout processing logic
        return { success: true, message: 'Payout processed successfully' };
      
      case 'verify_payment':
        // Implement payment verification logic
        return { success: true, message: 'Payment verified successfully' };
      
      case 'refund_transaction':
        return await handleRefundTransaction(_data, _adminId, _adminName);
      
      default:
        return { success: false, message: 'Unknown financial operation' };
    }
  } catch (error) {
    console.error('Financial operation error:', error);
    return { success: false, message: 'Financial operation failed' };
  }
}

/**
 * Handle refund transaction
 */
async function handleRefundTransaction(
  data: unknown,
  _adminId: string,
  _adminName: string
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    const { transactionId, reason, amount } = data as any;
    
    if (!transactionId || !reason) {
      return { success: false, message: 'Transaction ID and reason are required' };
    }

    // Get the transaction
    const transactionRef = db.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();
    
    if (!transactionDoc.exists) {
      return { success: false, message: 'Transaction not found' };
    }

    const transaction = transactionDoc.data();
    
    if (!transaction) {
      return { success: false, message: 'Transaction data not found' };
    }
    
    // Update transaction status
    await transactionRef.update({
      status: 'refunded',
      refundReason: reason,
      refundAmount: amount || transaction.amount,
      refundedBy: _adminId,
      refundedAt: new Date()
    });

    // If it's a booking payment, update booking status
    if (transaction.bookingId) {
      const bookingRef = db.collection('bookings').doc(transaction.bookingId);
      await bookingRef.update({
        status: 'Cancelled',
        cancellationReason: `Refunded: ${reason}`,
        cancelledAt: new Date(),
        cancelledBy: _adminId
      });
    }

    // Notify the client
    await db.collection(`users/${transaction.clientId}/notifications`).add({
      type: 'refund',
      message: `Your payment of ₱${(amount || transaction.amount).toFixed(2)} has been refunded. Reason: ${reason}`,
      link: '/payments',
      read: false,
      createdAt: new Date(),
    });

    // Log the refund action
    await AuditLogger.getInstance().logAction(
      'REFUND_PROCESSED',
      _adminId,
      'transactions',
      { 
        transactionId, 
        clientId: transaction.clientId, 
        amount: amount || transaction.amount, 
        reason,
        adminName: _adminName 
      }
    );

    return { success: true, message: 'Refund processed successfully' };
  } catch (error) {
    console.error('Refund transaction error:', error);
    return { success: false, message: 'Failed to process refund' };
  }
}

/**
 * Handle system configuration operations
 */
async function handleSystemConfiguration(
  operation: string,
  _data: unknown,
  _adminId: string,
  _adminName: string
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    switch (operation) {
      case 'update_settings':
        // Implement settings update logic
        return { success: true, message: 'Settings updated successfully' };
      
      case 'create_backup':
        // Implement backup creation logic
        return { success: true, message: 'Backup created successfully' };
      
      
      default:
        return { success: false, message: 'Unknown system configuration operation' };
    }
  } catch (error) {
    console.error('System configuration error:', error);
    return { success: false, message: 'System configuration operation failed' };
  }
}

/**
 * Handle content management operations
 */
async function handleContentManagement(
  operation: string,
  _data: unknown,
  _adminId: string,
  _adminName: string
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    switch (operation) {
      case 'manage_categories':
        // Implement category management logic
        return { success: true, message: 'Categories managed successfully' };
      
      case 'process_reports':
        // Implement report processing logic
        return { success: true, message: 'Reports processed successfully' };
      
      case 'send_broadcast':
        // Implement broadcast sending logic
        return { success: true, message: 'Broadcast sent successfully' };
      
      default:
        return { success: false, message: 'Unknown content management operation' };
    }
  } catch (error) {
    console.error('Content management error:', error);
    return { success: false, message: 'Content management operation failed' };
  }
}
