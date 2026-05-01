import { writable, derived, get } from 'svelte/store';
import type { WeightEntry, Goal, UserPreferences } from '$lib/models';

const API_BASE = '/api';

export const entries = writable<WeightEntry[]>([]);
export const goals = writable<Goal[]>([]);
export const preferences = writable<UserPreferences>({
	weightUnit: 'kg',
	measurementUnit: 'cm',
});
export const isLoading = writable(true);
export const isLoggedIn = writable(false);
export const currentUser = writable<string | null>(null);

export function getEntries(): WeightEntry[] {
	return get(entries);
}

export function getGoals(): Goal[] {
	return get(goals);
}

export const activeGoal = derived(goals, ($goals) =>
	$goals.find((g) => g.isActive)
);

export const sortedEntries = derived(entries, ($entries) =>
	[...$entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
);

export const latestEntry = derived(sortedEntries, ($sorted) => $sorted[0]);

export async function checkAuth() {
	try {
		console.log('[openweight] CLIENT - checkAuth() called');
		const res = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
		console.log('[openweight] CLIENT - checkAuth() response:', res.status, res.statusText);
		
		const data = await res.json();
		console.log('[openweight] CLIENT - checkAuth() data:', data);
		
		isLoggedIn.set(data.loggedIn);
		if (data.loggedIn) {
			currentUser.set(data.username || null);
		}
		return data.loggedIn;
	} catch (error) {
		console.error('[openweight] CLIENT - Auth check failed:', error);
		isLoggedIn.set(false);
		return false;
	}
}

export async function logout() {
	try {
		await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
		isLoggedIn.set(false);
		currentUser.set(null);
		entries.set([]);
		goals.set([]);
		preferences.set({ weightUnit: 'kg', measurementUnit: 'cm' });
	} catch (error) {
		console.error('Logout error:', error);
	}
}

export async function loadData() {
	isLoading.set(true);
	try {
		const [entriesRes, goalsRes, prefsRes] = await Promise.all([
			fetch(`${API_BASE}/entries`, { credentials: 'include' }),
			fetch(`${API_BASE}/goals`, { credentials: 'include' }),
			fetch(`${API_BASE}/preferences`, { credentials: 'include' })
		]);

		if (!entriesRes.ok || !goalsRes.ok || !prefsRes.ok) {
			throw new Error('Failed to fetch data');
		}

		const [entriesData, goalsData, prefsData] = await Promise.all([
			entriesRes.json(),
			goalsRes.json(),
			prefsRes.json()
		]);

		entries.set(entriesData);
		goals.set(goalsData);
		preferences.set(prefsData);
	} catch (error) {
		console.error('Load data error:', error);
		entries.set([]);
		goals.set([]);
		preferences.set({ weightUnit: 'kg', measurementUnit: 'cm' });
	} finally {
		isLoading.set(false);
	}
}

export async function addEntry(entry: WeightEntry) {
	console.log('[openweight] CLIENT - addEntry called with:', entry);
	try {
		const res = await fetch(`${API_BASE}/entries`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(entry),
			credentials: 'include'
		});
		console.log('[openweight] CLIENT - Add entry response:', res.status, res.statusText);
		
		if (!res.ok) {
			const text = await res.text();
			console.error('[openweight] CLIENT - Add entry error response:', text);
			throw new Error('Failed to add entry');
		}
		
		const saved = await res.json();
		console.log('[openweight] CLIENT - Entry saved:', saved);
		entries.update((e) => [...e, saved]);
	} catch (error) {
		console.error('[openweight] CLIENT - addEntry FAILED:', error);
		throw error;
	}
}

export async function updateEntry(entry: WeightEntry) {
	const res = await fetch(`${API_BASE}/entries`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(entry),
		credentials: 'include'
	});
	if (!res.ok) throw new Error('Failed to update entry');
	const saved = await res.json();
	entries.update((e) => e.map((x) => (x.id === entry.id ? saved : x)));
}

export async function deleteEntry(id: string) {
	const res = await fetch(`${API_BASE}/entries?id=${id}`, { method: 'DELETE', credentials: 'include' });
	if (!res.ok) throw new Error('Failed to delete entry');
	entries.update((e) => e.filter((x) => x.id !== id));
}

export async function addGoal(goal: Goal) {
	console.log('[openweight] CLIENT - addGoal called with:', goal);
	try {
		const res = await fetch(`${API_BASE}/goals`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(goal),
			credentials: 'include'
		});
		console.log('[openweight] CLIENT - Add goal response:', res.status, res.statusText);
		
		if (!res.ok) {
			const text = await res.text();
			console.error('[openweight] CLIENT - Add goal error response:', text);
			throw new Error('Failed to add goal');
		}
		
		const saved = await res.json();
		console.log('[openweight] CLIENT - Goal saved:', saved);
		goals.update((g) => [...g, saved]);
	} catch (error) {
		console.error('[openweight] CLIENT - addGoal FAILED:', error);
		throw error;
	}
}

export async function updateGoal(goal: Goal) {
	const res = await fetch(`${API_BASE}/goals`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(goal),
		credentials: 'include'
	});
	if (!res.ok) throw new Error('Failed to update goal');
	const saved = await res.json();
	goals.update((g) => g.map((x) => (x.id === goal.id ? saved : x)));
}

export async function setActiveGoal(goalId: string) {
	const goalsArray = get(goals);
	for (const goal of goalsArray) {
		const updated = { ...goal, isActive: goal.id === goalId };
		await updateGoal(updated);
	}
	goals.update((g) => g.map((x) => ({ ...x, isActive: x.id === goalId })));
}

export async function deleteGoal(id: string) {
	const res = await fetch(`${API_BASE}/goals/delete?id=${id}`, { method: 'DELETE', credentials: 'include' });
	if (!res.ok) throw new Error('Failed to delete goal');
	goals.update((g) => g.filter((x) => x.id !== id));
}

export async function updatePreferences(partial: Partial<UserPreferences>) {
	const current = get(preferences);
	const updated = { ...current, ...partial };
	console.log('[openweight] CLIENT - Updating preferences:', updated);
	const res = await fetch(`${API_BASE}/preferences`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updated),
		credentials: 'include'
	});
	console.log('[openweight] CLIENT - Preferences update response:', res.status, res.statusText);
	console.log('[openweight] CLIENT - Preferences response headers:', [...res.headers.entries()]);
	if (!res.ok) throw new Error('Failed to update preferences');
	const saved = await res.json();
	console.log('[openweight] CLIENT - Preferences saved:', saved);
	preferences.set(saved);
}