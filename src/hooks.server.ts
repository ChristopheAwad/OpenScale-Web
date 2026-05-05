import type { Handle } from '@sveltejs/kit';
import { logger, generateRequestId } from '$lib/server/logger';

export const handle: Handle = async ({ event, resolve }) => {
	const requestId = generateRequestId();
	const startTime = Date.now();
	
	// Add request ID to event locals for downstream use
	event.locals.requestId = requestId;
	
	const context = {
		requestId,
		method: event.request.method,
		path: event.url.pathname,
		userAgent: event.request.headers.get('user-agent'),
		ip: event.getClientAddress()
	};

	try {
		// Log incoming request
		if (event.url.pathname.startsWith('/api/')) {
			logger.info('API Request started', context);
		}

		const response = await resolve(event);
		
		const duration = Date.now() - startTime;
		
		// Log response
		if (event.url.pathname.startsWith('/api/')) {
			const responseContext = {
				...context,
				status: response.status,
				duration: `${duration}ms`
			};

			// Log slow requests
			if (duration > 500) {
				logger.warn('Slow API request', responseContext);
			}

			// Log error responses
			if (response.status >= 400) {
				logger.warn('API request failed', responseContext);
			} else {
				logger.debug('API Request completed', responseContext);
			}
		}

		// Log Set-Cookie headers for auth endpoints (preserving existing behavior)
		if (event.url.pathname.startsWith('/api/auth')) {
			const headers: Record<string, string> = {};
			response.headers.forEach((value: string, key: string) => {
				headers[key] = value;
			});
			const setCookie = response.headers.get('set-cookie') || response.headers.get('Set-Cookie');
			logger.debug('Auth response headers', {
				requestId,
				path: event.url.pathname,
				status: response.status,
				setCookie: setCookie || 'NOT PRESENT'
			});
		}

		return response;
	} catch (error) {
		const duration = Date.now() - startTime;
		const errorContext = {
			...context,
			duration: `${duration}ms`
		};

		logger.error('Unhandled request error', error instanceof Error ? error : new Error(String(error)), errorContext);

		// Re-throw to let SvelteKit handle the error page
		throw error;
	}
};
