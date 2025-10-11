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
  service?: string;
  environment?: string;
  version?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private serviceName: string;
  private version: string;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.serviceName = process.env.SERVICE_NAME || 'localpro-api';
    this.version = process.env.SERVICE_VERSION || '1.0.0';
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

  private log(level: LogLevelType, message: string, context?: Record<string, any>, error?: Error, userId?: string, requestId?: string): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId,
      requestId,
      service: this.serviceName,
      environment: process.env.NODE_ENV,
      version: this.version,
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
    try {
      // Send to multiple production logging services
      this.sendToSentry(entry);
      this.sendToDataDog(entry);
      this.sendToCloudWatch(entry);
      this.sendToStructuredLogs(entry);
    } catch (error) {
      // Fallback to console if production logging fails
      console.error('Failed to send to production logger:', error);
      console.log(JSON.stringify(entry));
    }
  }

  private sendToSentry(entry: LogEntry): void {
    // Sentry integration
    if (process.env.SENTRY_DSN && entry.level === 'error' && entry.error) {
      // Note: This would require @sentry/nextjs to be installed
      // Sentry.captureException(new Error(entry.error.message), {
      //   tags: entry.context,
      //   user: entry.userId ? { id: entry.userId } : undefined,
      //   extra: {
      //     service: entry.service,
      //     version: entry.version,
      //     requestId: entry.requestId,
      //   },
      // });
    }
  }

  private sendToDataDog(entry: LogEntry): void {
    // DataDog integration
    if (process.env.DATADOG_API_KEY) {
      const _datadogLog = {
        ddsource: 'nodejs',
        ddtags: `env:${entry.environment},service:${entry.service},version:${entry.version}`,
        hostname: process.env.HOSTNAME || 'unknown',
        message: entry.message,
        level: entry.level,
        timestamp: entry.timestamp,
        ...entry.context,
        ...(entry.userId && { user_id: entry.userId }),
        ...(entry.requestId && { request_id: entry.requestId }),
      };

      // In a real implementation, you would send this to DataDog's API
      // fetch('https://http-intake.logs.datadoghq.com/v1/input/' + process.env.DATADOG_API_KEY, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(datadogLog),
      // });
    }
  }

  private sendToCloudWatch(entry: LogEntry): void {
    // AWS CloudWatch integration
    if (process.env.AWS_REGION && process.env.CLOUDWATCH_LOG_GROUP) {
      const _cloudwatchLog = {
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        service: entry.service,
        environment: entry.environment,
        version: entry.version,
        ...entry.context,
        ...(entry.userId && { userId: entry.userId }),
        ...(entry.requestId && { requestId: entry.requestId }),
        ...(entry.error && { error: entry.error }),
      };

      // In a real implementation, you would use AWS SDK to send to CloudWatch
      // const cloudwatch = new AWS.CloudWatchLogs();
      // cloudwatch.putLogEvents({
      //   logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
      //   logStreamName: `${entry.service}-${entry.environment}`,
      //   logEvents: [{
      //     timestamp: Date.now(),
      //     message: JSON.stringify(cloudwatchLog),
      //   }],
      // });
    }
  }

  private sendToStructuredLogs(entry: LogEntry): void {
    // Structured JSON logging for log aggregation services
    if (process.env.STRUCTURED_LOGGING_ENABLED === 'true') {
      // Output structured JSON for log aggregation (ELK stack, Fluentd, etc.)
      console.log(JSON.stringify({
        '@timestamp': entry.timestamp,
        level: entry.level,
        message: entry.message,
        service: entry.service,
        environment: entry.environment,
        version: entry.version,
        ...entry.context,
        ...(entry.userId && { userId: entry.userId }),
        ...(entry.requestId && { requestId: entry.requestId }),
        ...(entry.error && { error: entry.error }),
      }));
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error, userId?: string, requestId?: string): void {
    this.log('error', message, context, error, userId, requestId);
  }

  warn(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.log('warn', message, context, undefined, userId, requestId);
  }

  info(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.log('info', message, context, undefined, userId, requestId);
  }

  debug(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.log('debug', message, context, undefined, userId, requestId);
  }

  // Specialized logging methods
  auth(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.info(`[AUTH] ${message}`, context, userId, requestId);
  }

  payment(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.info(`[PAYMENT] ${message}`, context, userId, requestId);
  }

  api(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.info(`[API] ${message}`, context, userId, requestId);
  }

  security(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.warn(`[SECURITY] ${message}`, context, userId, requestId);
  }

  performance(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.info(`[PERFORMANCE] ${message}`, context, userId, requestId);
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
