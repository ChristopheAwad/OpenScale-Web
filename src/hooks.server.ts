import { getSessionUser } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

const publicRoutes = ['/auth/login', '/auth/register', '/api/auth/login', '/api/auth/register', '/api/auth/logout'];

export const handle: Handle = async ({ event, resolve }) => {
	const user = getSessionUser(event.cookies);
	event.locals.user = user;

	const path = event.url.pathname;
	const isPublic = publicRoutes.some((route) => path.startsWith(route));

	if (!user && !isPublic && !path.startsWith('/api')) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/auth/login' }
		});
	}

	return resolve(event);
};
