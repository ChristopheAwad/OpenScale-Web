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
		const res = await fetch(`${API_BASE}/auth/logout`);
		const data = await res.json();
		isLoggedIn.set(data.loggedIn);
		if (data.loggedIn) {
			currentUser.set(data.username || null);
		}
		return data.loggedIn;
	} catch {
		isLoggedIn.set(false);
		return false;
	}
}

export async function logout() {
	try {
		await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
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
			fetch(`${API_BASE}/entries`),
			fetch(`${API_BASE}/goals`),
			fetch(`${API_BASE}/preferences`)
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
	const res = await fetch(`${API_BASE}/entries`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(entry)
	});
	if (!res.ok) throw new Error('Failed to add entry');
	const saved = await res.json();
	entries.update((e) => [...e, saved]);
}

export async function updateEntry(entry: WeightEntry) {
	const res = await fetch(`${API_BASE}/entries`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(entry)
	});
	if (!res.ok) throw new Error('Failed to update entry');
	const saved = await res.json();
	entries.update((e) => e.map((x) => (x.id === entry.id ? saved : x)));
}

export async function deleteEntry(id: string) {
	const res = await fetch(`${API_BASE}/entries?id=${id}`, { method: 'DELETE' });
	if (!res.ok) throw new Error('Failed to delete entry');
	entries.update((e) => e.filter((x) => x.id !== id));
}

export async function addGoal(goal: Goal) {
	const res = await fetch(`${API_BASE}/goals`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(goal)
	});
	if (!res.ok) throw new Error('Failed to add goal');
	const saved = await res.json();
	goals.update((g) => [...g, saved]);
}

export async function updateGoal(goal: Goal) {
	const res = await fetch(`${API_BASE}/goals`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(goal)
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
	const res = await fetch(`${API_BASE}/goals/delete?id=${id}`, { method: 'DELETE' });
	if (!res.ok) throw new Error('Failed to delete goal');
	goals.update((g) => g.filter((x) => x.id !== id));
}

export async function updatePreferences(partial: Partial<UserPreferences>) {
	const current = get(preferences);
	const updated = { ...current, ...partial };
	const res = await fetch(`${API_BASE}/preferences`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updated)
	});
	if (!res.ok) throw new Error('Failed to update preferences');
	const saved = await res.json();
	preferences.set(saved);
}