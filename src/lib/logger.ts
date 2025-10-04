interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const _LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

type LogLevelType = LogLevel[keyof LogLevel];

interface LogEntry {
  level: LogLevelType;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, userId, requestId, error } = entry;
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (userId) logMessage += ` | User: ${userId}`;
    if (requestId) logMessage += ` | Request: ${requestId}`;
    
    if (context && Object.keys(context).length > 0) {
      logMessage += ` | Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      logMessage += ` | Error: ${error.name}: ${error.message}`;
      if (this.isDevelopment && error.stack) {
        logMessage += `\nStack: ${error.stack}`;
      }
    }
    
    return logMessage;
  }

  private log(level: LogLevelType, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    const formattedLog = this.formatLog(entry);

    // Console logging
    switch (level) {
      case 'error':
        console.error(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
    }

    // Production logging (implement your preferred service)
    if (this.isProduction) {
      this.sendToProductionLogger(entry);
    }
  }

  private sendToProductionLogger(entry: LogEntry): void {
    // TODO: Implement production logging service
    // Examples: Sentry, LogRocket, DataDog, CloudWatch, etc.
    
    // Example for Sentry:
    // if (entry.level === 'error' && entry.error) {
    //   Sentry.captureException(entry.error, {
    //     tags: entry.context,
    //     user: entry.userId ? { id: entry.userId } : undefined,
    //   });
    // }
    
    // Example for structured logging:
    // console.log(JSON.stringify(entry));
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  // Specialized logging methods
  auth(message: string, context?: Record<string, any>): void {
    this.info(`[AUTH] ${message}`, context);
  }

  payment(message: string, context?: Record<string, any>): void {
    this.info(`[PAYMENT] ${message}`, context);
  }

  api(message: string, context?: Record<string, any>): void {
    this.info(`[API] ${message}`, context);
  }

  security(message: string, context?: Record<string, any>): void {
    this.warn(`[SECURITY] ${message}`, context);
  }

  performance(message: string, context?: Record<string, any>): void {
    this.info(`[PERFORMANCE] ${message}`, context);
  }
}

// Create singleton instance
export const logger = new Logger();

// Utility functions for common logging patterns
export const logApiRequest = (method: string, url: string, userId?: string) => {
  logger.api(`${method} ${url}`, { method, url, userId });
};

export const logApiResponse = (method: string, url: string, statusCode: number, duration: number, userId?: string) => {
  logger.api(`${method} ${url} - ${statusCode} (${duration}ms)`, { 
    method, 
    url, 
    statusCode, 
    duration, 
    userId 
  });
};

export const logAuthEvent = (event: string, userId?: string, context?: Record<string, any>) => {
  logger.auth(event, { userId, ...context });
};

export const logPaymentEvent = (event: string, amount?: number, currency?: string, context?: Record<string, any>) => {
  logger.payment(event, { amount, currency, ...context });
};

export const logSecurityEvent = (event: string, context?: Record<string, any>) => {
  logger.security(event, context);
};

export const logPerformance = (operation: string, duration: number, context?: Record<string, any>) => {
  logger.performance(`${operation} completed in ${duration}ms`, { operation, duration, ...context });
};
