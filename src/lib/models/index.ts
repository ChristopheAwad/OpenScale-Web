export type Unit = 'kg' | 'lb' | 'cm' | 'in';

export type MeasurementType = 'waist' | 'chest' | 'hips' | 'arms' | 'thighs';

export interface Measurement {
	type: MeasurementType;
	value: number;
	unit: 'cm' | 'in';
}

export interface WeightEntry {
	id: string;
	weight: number;
	weightUnit: Unit;
	date: string;
	notes?: string;
	measurements?: Measurement[];
	photoPath?: string;
}

export interface Goal {
	id: string;
	targetWeight: number;
	weightUnit: Unit;
	targetDate?: string;
	isActive: boolean;
	createdAt: string;
}

export interface UserPreferences {
	weightUnit: 'kg' | 'lb';
	measurementUnit: 'cm' | 'in';
}

export function generateId(): string {
	return crypto.randomUUID();
}

export function createWeightEntry(
	weight: number,
	weightUnit: Unit,
	date: string,
	notes?: string,
	measurements?: Measurement[],
	photoPath?: string
): WeightEntry {
	return {
		id: generateId(),
		weight,
		weightUnit,
		date,
		notes,
		measurements,
		photoPath,
	};
}

export function createGoal(
	targetWeight: number,
	weightUnit: Unit,
	targetDate?: string
): Goal {
	return {
		id: generateId(),
		targetWeight,
		weightUnit,
		targetDate,
		isActive: true,
		createdAt: new Date().toISOString(),
	};
}