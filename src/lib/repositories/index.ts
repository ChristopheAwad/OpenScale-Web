import { get, set, del } from 'idb-keyval';
import type { WeightEntry, Goal, UserPreferences } from '$lib/models';

const ENTRIES_KEY = 'weight_entries';
const GOALS_KEY = 'goals';
const PREFERENCES_KEY = 'user_preferences';

export const entriesRepository = {
	async getAll(): Promise<WeightEntry[]> {
		const entries = await get<WeightEntry[]>(ENTRIES_KEY);
		return entries ?? [];
	},

	async getById(id: string): Promise<WeightEntry | undefined> {
		const entries = await this.getAll();
		return entries.find((e) => e.id === id);
	},

	async add(entry: WeightEntry): Promise<void> {
		const entries = await this.getAll();
		entries.push(entry);
		await set(ENTRIES_KEY, entries);
	},

	async update(entry: WeightEntry): Promise<void> {
		const entries = await this.getAll();
		const index = entries.findIndex((e) => e.id === entry.id);
		if (index !== -1) {
			entries[index] = entry;
			await set(ENTRIES_KEY, entries);
		}
	},

	async delete(id: string): Promise<void> {
		const entries = await this.getAll();
		const filtered = entries.filter((e) => e.id !== id);
		await set(ENTRIES_KEY, filtered);
	},

	async clear(): Promise<void> {
		await del(ENTRIES_KEY);
	},
};

export const goalsRepository = {
	async getAll(): Promise<Goal[]> {
		const goals = await get<Goal[]>(GOALS_KEY);
		return goals ?? [];
	},

	async getActive(): Promise<Goal | undefined> {
		const goals = await this.getAll();
		return goals.find((g) => g.isActive);
	},

	async add(goal: Goal): Promise<void> {
		const goals = await this.getAll();
		goals.push(goal);
		await set(GOALS_KEY, goals);
	},

	async update(goal: Goal): Promise<void> {
		const goals = await this.getAll();
		const index = goals.findIndex((g) => g.id === goal.id);
		if (index !== -1) {
			goals[index] = goal;
			await set(GOALS_KEY, goals);
		}
	},

	async setActive(goalId: string): Promise<void> {
		const goals = await this.getAll();
		for (const goal of goals) {
			goal.isActive = goal.id === goalId;
		}
		await set(GOALS_KEY, goals);
	},

	async delete(id: string): Promise<void> {
		const goals = await this.getAll();
		const filtered = goals.filter((g) => g.id !== id);
		await set(GOALS_KEY, filtered);
	},

	async clear(): Promise<void> {
		await del(GOALS_KEY);
	},
};

const defaultPreferences: UserPreferences = {
	weightUnit: 'kg',
	measurementUnit: 'cm',
};

export const preferencesRepository = {
	async get(): Promise<UserPreferences> {
		const prefs = await get<UserPreferences>(PREFERENCES_KEY);
		return prefs ?? defaultPreferences;
	},

	async set(prefs: UserPreferences): Promise<void> {
		await set(PREFERENCES_KEY, prefs);
	},

	async update(partial: Partial<UserPreferences>): Promise<UserPreferences> {
		const current = await this.get();
		const updated = { ...current, ...partial };
		await set(PREFERENCES_KEY, updated);
		return updated;
	},

	async reset(): Promise<void> {
		await set(PREFERENCES_KEY, defaultPreferences);
	},
};