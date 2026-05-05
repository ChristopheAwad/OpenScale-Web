import { vi } from 'vitest';

// Mock cookies object for testing
export function createMockCookies(sessionToken?: string) {
	const cookies = new Map<string, string>();
	
	if (sessionToken) {
		cookies.set('session', sessionToken);
	}
	
	return {
		get: vi.fn((name: string) => cookies.get(name) || undefined),
		set: vi.fn((name: string, value: string, options?: any) => {
			cookies.set(name, value);
		}),
		delete: vi.fn((name: string, options?: any) => {
			cookies.delete(name);
		}),
		_has: cookies.has.bind(cookies),
		_set: cookies.set.bind(cookies)
	} as any;
}

// Helper to create authenticated request context
export function createAuthContext(userId: string, username: string, token?: string) {
	const sessionToken = token || crypto.randomUUID();
	const cookies = createMockCookies(sessionToken);
	
	return {
		cookies,
		sessionToken,
		user: { id: userId, username }
	};
}
