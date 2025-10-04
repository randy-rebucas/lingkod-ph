import { NextResponse } from 'next/server';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class PaymentError extends CustomError {
  constructor(message: string = 'Payment processing failed') {
    super(message, 402, 'PAYMENT_ERROR');
  }
}

// Error logging utility
export function logError(error: AppError, context?: Record<string, any>) {
  const errorInfo = {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', errorInfo);
  }

  // In production, you would send this to your logging service
  // Example: Sentry, LogRocket, DataDog, etc.
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement production logging
    console.error('Production error:', errorInfo);
  }
}

// Global error handler for API routes
export function handleApiError(error: unknown): NextResponse {
  let appError: AppError;

  if (error instanceof CustomError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new CustomError(error.message);
  } else {
    appError = new CustomError('An unexpected error occurred');
  }

  // Log the error
  logError(appError);

  // Return appropriate response
  return NextResponse.json(
    {
      error: {
        message: appError.message,
        code: appError.code,
        ...(process.env.NODE_ENV === 'development' && { stack: appError.stack }),
      },
    },
    { status: appError.statusCode || 500 }
  );
}

// Client-side error handler
export function handleClientError(error: unknown): void {
  let appError: AppError;

  if (error instanceof CustomError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new CustomError(error.message);
  } else {
    appError = new CustomError('An unexpected error occurred');
  }

  // Log the error
  logError(appError);

  // Show user-friendly error message
  // You can integrate with your toast notification system here
  console.error('Client error:', appError.message);
}

// Async error wrapper for API routes
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return await fn(...args);
  };
}

// Error boundary for React components
export function getErrorBoundaryFallback(error: Error) {
  return {
    error: {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  };
}
