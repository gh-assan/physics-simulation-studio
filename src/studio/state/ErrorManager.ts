/**
 * Error Manager - Centralized error handling with global state integration
 * This adds sophisticated error management to your application
 */

import { getGlobalStore } from './GlobalStore';
import { Actions } from './Actions';
import { Logger } from '../../core/utils/Logger';

export interface ErrorContext {
  source: string;
  action?: string;
  additionalData?: any;
}

export class ErrorManager {
  private static instance: ErrorManager | null = null;

  private constructor() {
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  /**
   * Report a warning
   */
  reportWarning(message: string, context: ErrorContext): void {
    this.reportError(message, 'warning', context);
    Logger.getInstance().warn(`[${context.source}] ${message}`, context);
  }

  /**
   * Report an error
   */
  reportError(message: string, level: 'warning' | 'error' | 'critical' = 'error', context: ErrorContext): void {
    const store = getGlobalStore();

    store.dispatch(Actions.errorOccurred(
      message,
      level,
      context.source,
      context.additionalData?.stack
    ));

    // Log to console based on level
    if (level === 'critical') {
      Logger.getInstance().error(`[CRITICAL][${context.source}] ${message}`, context);
      console.error('💥 CRITICAL ERROR:', message, context);
    } else if (level === 'error') {
      Logger.getInstance().error(`[ERROR][${context.source}] ${message}`, context);
      console.error('❌ ERROR:', message, context);
    } else {
      Logger.getInstance().warn(`[WARNING][${context.source}] ${message}`, context);
      console.warn('⚠️ WARNING:', message, context);
    }
  }

  /**
   * Report a critical error that might require application restart
   */
  reportCriticalError(message: string, context: ErrorContext, error?: Error): void {
    const errorContext = {
      ...context,
      additionalData: {
        ...context.additionalData,
        stack: error?.stack,
        timestamp: Date.now(),
      }
    };

    this.reportError(message, 'critical', errorContext);

    // For critical errors, also log to external services if configured
    this.handleCriticalError(message, errorContext, error);
  }

  /**
   * Acknowledge an error (mark as read)
   */
  acknowledgeError(errorId: string): void {
    const store = getGlobalStore();
    store.dispatch(Actions.errorAcknowledged(errorId));
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    const store = getGlobalStore();
    store.dispatch(Actions.errorsCleared());
  }

  /**
   * Wrap a function with error handling
   */
  withErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    context: ErrorContext
  ): T {
    return ((...args: any[]) => {
      try {
        const result = fn(...args);

        // Handle promises
        if (result && typeof result.then === 'function') {
          return result.catch((error: Error) => {
            this.reportError(
              error.message || 'Async operation failed',
              'error',
              { ...context, additionalData: { error } }
            );
            throw error;
          });
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        this.reportError(
          errorMessage,
          'error',
          { ...context, additionalData: { error } }
        );

        throw error;
      }
    }) as T;
  }

  /**
   * Create an error boundary for React-like error handling
   */
  createErrorBoundary(componentName: string) {
    return {
      handleError: (error: Error, errorInfo?: any) => {
        this.reportError(
          `Component error in ${componentName}: ${error.message}`,
          'error',
          {
            source: componentName,
            action: 'render',
            additionalData: { error, errorInfo }
          }
        );
      }
    };
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.reportError(
        event.message || 'Uncaught error',
        'error',
        {
          source: 'GlobalErrorHandler',
          action: 'window.error',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
          }
        }
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        `Unhandled promise rejection: ${event.reason}`,
        'error',
        {
          source: 'GlobalErrorHandler',
          action: 'unhandledrejection',
          additionalData: { reason: event.reason }
        }
      );

      // Prevent the error from appearing in console
      event.preventDefault();
    });
  }

  /**
   * Handle critical errors
   */
  private handleCriticalError(message: string, context: ErrorContext, error?: Error): void {
    // Here you could integrate with external error reporting services
    // like Sentry, Bugsnag, etc.

    console.error('💥💥💥 CRITICAL ERROR REPORTED 💥💥💥');
    console.error('Message:', message);
    console.error('Context:', context);
    console.error('Error:', error);

    // Optionally show user notification for critical errors
    this.showUserNotification('A critical error occurred. Please save your work and refresh the page.');
  }

  /**
   * Show user notification (simple implementation)
   */
  private showUserNotification(message: string): void {
    // This could be replaced with your UI notification system
    if (typeof window !== 'undefined' && window.alert) {
      setTimeout(() => {
        window.alert(`⚠️ ${message}`);
      }, 100);
    }
  }
}

/**
 * Convenience function to get the error manager
 */
export function getErrorManager(): ErrorManager {
  return ErrorManager.getInstance();
}

/**
 * Decorator for automatic error handling in class methods
 */
export function handleErrors(context: Partial<ErrorContext> = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = function (...args: any[]) {
      const errorManager = getErrorManager();
      const fullContext: ErrorContext = {
        source: className,
        action: propertyName,
        ...context
      };

      return errorManager.withErrorHandling(originalMethod.bind(this), fullContext)(...args);
    };

    return descriptor;
  };
}

/**
 * Utility to wrap async operations with error handling
 */
export async function withAsyncErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  const errorManager = getErrorManager();

  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Async operation failed';

    errorManager.reportError(
      errorMessage,
      'error',
      { ...context, additionalData: { error } }
    );

    throw error;
  }
}
