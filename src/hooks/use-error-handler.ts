import { useCallback } from 'react';
import { useToast } from './use-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { toast } = useToast();
  const { showToast = true, logError = true, fallbackMessage = 'An unexpected error occurred' } = options;

  const handleError = useCallback((error: unknown, context?: string) => {
    let errorMessage = fallbackMessage;
    let toastMessage = fallbackMessage;

    if (error instanceof Error) {
      errorMessage = error.message;
      toastMessage = error.message;

      // Handle specific error types
      if (error.message.includes('Authentication required')) {
        errorMessage = 'Please log in to continue';
        toastMessage = 'You need to be logged in to perform this action.';
      } else if (error.message.includes('fetch') || error.message.includes('HTTP')) {
        errorMessage = 'Network error. Please check your connection.';
        toastMessage = 'Unable to connect to the service. Please check your internet connection.';
      } else if (error.message.includes('Firebase')) {
        errorMessage = 'Database error occurred';
        toastMessage = 'A database error occurred. Please try again.';
      }
    }

    if (logError) {
      console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    }

    if (showToast) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: toastMessage,
      });
    }

    return errorMessage;
  }, [toast, showToast, logError, fallbackMessage]);

  return { handleError };
}
