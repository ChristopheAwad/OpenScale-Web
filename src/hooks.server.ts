import type { RequestHandler } from '@sveltejs/kit';

export const handle: RequestHandler = async ({ event, resolve }) => {
	const response = await resolve(event);
	
	// Log Set-Cookie headers for auth endpoints
	if (event.url.pathname.startsWith('/api/auth')) {
		console.log('[openweight] RESPONSE - url:', event.url.pathname);
		console.log('[openweight] RESPONSE - status:', response.status);
		
		// Log all response headers
		const headers: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			headers[key] = value;
		});
		console.log('[openweight] RESPONSE - headers:', headers);
		
		// Specifically log Set-Cookie header
		const setCookie = response.headers.get('set-cookie') || response.headers.get('Set-Cookie');
		console.log('[openweight] RESPONSE - Set-Cookie header:', setCookie || 'NOT PRESENT');
	}
	
	return response;
};
