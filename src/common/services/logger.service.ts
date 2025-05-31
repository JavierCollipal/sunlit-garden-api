import { Injectable, Logger } from '@nestjs/common';

interface ErrorDetails {
  message: string;
  stack?: string;
  response?: unknown;
}

interface LogMessage {
  timestamp: string;
  operation: string;
  context: string;
  details: unknown;
  error?: ErrorDetails;
}

@Injectable()
export class LoggerService extends Logger {
  protected override context: string;

  constructor(contextName?: string) {
    super(contextName ?? 'Application');
    this.context = contextName ?? 'Application';
  }

  logOperation(operation: string, details: unknown, error?: Error): void {
    const timestamp = new Date().toISOString();
    const logMessage: LogMessage = {
      timestamp,
      operation,
      context: this.context,
      details,
      ...(error && { error: this.formatError(error) }),
    };

    if (error) {
      this.error(JSON.stringify(logMessage, null, 2));
    } else {
      this.log(JSON.stringify(logMessage, null, 2));
    }
  }

  private formatError(error: Error): ErrorDetails {
    return {
      message: error.message,
      stack: error.stack,
      ...(error instanceof Error &&
        'response' in error && {
          response: (error as { response: unknown }).response,
        }),
    };
  }
}
