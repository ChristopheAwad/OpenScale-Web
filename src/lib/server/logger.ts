type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

interface LogContext {
	requestId?: string;
	userId?: string;
	path?: string;
	method?: string;
	[key: string]: any;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
	const timestamp = new Date().toISOString();
	const logEntry: Record<string, any> = {
		timestamp,
		level: level.toUpperCase(),
		message,
		...context
	};

	if (error) {
		logEntry.error = {
			name: error.name,
			message: error.message,
			stack: error.stack
		};
	}

	if (process.env.NODE_ENV === 'production') {
		return JSON.stringify(logEntry);
	}

	const contextStr = context ? ` ${JSON.stringify(context)}` : '';
	const errorStr = error ? `\n${error.stack}` : '';
	return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}${errorStr}`;
}

function shouldLog(level: LogLevel): boolean {
	return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
	debug(message: string, context?: LogContext): void {
		if (shouldLog('debug')) {
			console.log(formatMessage('debug', message, context));
		}
	},

	info(message: string, context?: LogContext): void {
		if (shouldLog('info')) {
			console.log(formatMessage('info', message, context));
		}
	},

	warn(message: string, context?: LogContext): void {
		if (shouldLog('warn')) {
			console.warn(formatMessage('warn', message, context));
		}
	},

	error(message: string, error?: Error, context?: LogContext): void {
		if (shouldLog('error')) {
			console.error(formatMessage('error', message, context, error));
		}
	}
};

export function generateRequestId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export type { LogContext, LogLevel };
