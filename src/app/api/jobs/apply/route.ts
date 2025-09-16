import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';
import { auditLogger, extractRequestMetadata } from '@/lib/audit-logger';
import { verifyUserRole } from '@/lib/auth-utils';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for job applications
    const rateLimitResult = await rateLimiters.jobApplications.checkLimit(request);
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Extract request metadata for audit logging
    const metadata = extractRequestMetadata(request);
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      await auditLogger.logSecurityEvent(
        'unknown',
        'unknown',
        'unauthorized_job_application_attempt',
        { ...metadata, reason: 'No authorization header' }
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { jobId, providerId } = await request.json();

    // Verify user role
    const isProvider = await verifyUserRole(providerId, ['provider']);
    if (!isProvider) {
      await auditLogger.logSecurityEvent(
        providerId,
        'provider',
        'unauthorized_job_application_attempt',
        { ...metadata, jobId, reason: 'Invalid role' }
      );
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if job exists and is open
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists()) {
      await auditLogger.logSecurityEvent(
        providerId,
        'provider',
        'job_application_failed',
        { ...metadata, jobId, reason: 'Job not found' }
      );
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobData = jobDoc.data();
    if (jobData.status !== 'Open') {
      await auditLogger.logSecurityEvent(
        providerId,
        'provider',
        'job_application_failed',
        { ...metadata, jobId, reason: 'Job not open' }
      );
      return NextResponse.json({ error: 'Job is not open for applications' }, { status: 400 });
    }

    // Check if provider already applied
    if (jobData.applications?.includes(providerId)) {
      await auditLogger.logSecurityEvent(
        providerId,
        'provider',
        'duplicate_job_application_attempt',
        { ...metadata, jobId }
      );
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 400 });
    }

    // Apply to job
    await updateDoc(jobRef, {
      applications: arrayUnion(providerId)
    });

    // Log successful application
    await auditLogger.logAction(
      providerId,
      'provider',
      'job_application_successful',
      'jobs',
      jobId,
      { ...metadata, jobTitle: jobData.title, clientId: jobData.clientId },
      'medium',
      true
    );

    const response = NextResponse.json({ 
      success: true, 
      message: 'Successfully applied to job' 
    });
    
    addRateLimitHeaders(response, rateLimitResult);
    return response;

  } catch (error) {
    console.error('Job application error:', error);
    
    // Log error
    await auditLogger.logSecurityEvent(
      'unknown',
      'unknown',
      'job_application_error',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
