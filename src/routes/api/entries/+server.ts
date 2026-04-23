import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { requireUser, getSessionUser } from '$lib/server/auth';
import type { WeightEntry, Measurement } from '$lib/models';

initDb();

function serializeEntry(row: any): WeightEntry {
	return {
		id: row.id,
		weight: row.weight,
		weightUnit: row.weight_unit,
		date: row.date,
		notes: row.notes || undefined,
		measurements: row.measurements ? JSON.parse(row.measurements) : undefined,
		photoPath: row.photo_path || undefined
	};
}

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const user = getSessionUser(cookies);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const rows = database.entries.getAll(user.id);
		const entries = rows.map(serializeEntry);
		return json(entries);
	} catch (error) {
		console.error('Entries GET error:', error);
		return json({ error: 'Failed to fetch entries' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const user = requireUser(cookies);
		const body = await request.json();

		const entry = database.entries.create({
			userId: user.id,
			weight: body.weight,
			weightUnit: body.weightUnit,
			date: body.date,
			notes: body.notes,
			measurements: body.measurements ? JSON.stringify(body.measurements) : undefined,
			photoPath: body.photoPath
		});

		return json(serializeEntry(entry));
	} catch (error) {
		console.error('Entries POST error:', error);
		return json({ error: 'Failed to create entry' }, { status: 400 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies }) => {
	try {
		const user = requireUser(cookies);
		const body = await request.json();

		const entry = database.entries.update({
			id: body.id,
			userId: user.id,
			weight: body.weight,
			weightUnit: body.weightUnit,
			date: body.date,
			notes: body.notes,
			measurements: body.measurements ? JSON.stringify(body.measurements) : undefined,
			photoPath: body.photoPath
		});

		if (!entry) {
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		return json(serializeEntry(entry));
	} catch (error) {
		console.error('Entries PUT error:', error);
		return json({ error: 'Failed to update entry' }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	try {
		const user = requireUser(cookies);
		const id = url.searchParams.get('id');

		if (!id) {
			return json({ error: 'Entry ID required' }, { status: 400 });
		}

		database.entries.delete(id, user.id);
		return json({ success: true });
	} catch (error) {
		console.error('Entries DELETE error:', error);
		return json({ error: 'Failed to delete entry' }, { status: 400 });
	}
};