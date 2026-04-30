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
		console.log('[openweight] GET /api/entries - checking session');
		const user = getSessionUser(cookies);
		if (!user) {
			console.log('[openweight] GET /api/entries - unauthorized: no valid session');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('[openweight] GET /api/entries - user:', user.username);
		const rows = database.entries.getAll(user.id);
		const entries = rows.map(serializeEntry);
		return json(entries);
	} catch (error) {
		console.error('[openweight] Entries GET error:', error);
		return json({ error: 'Failed to fetch entries' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		console.log('[openweight] POST /api/entries - headers:', Object.fromEntries(request.headers.entries()));
		console.log('[openweight] POST /api/entries - checking session, cookies present:', !!cookies.get('session'));
		
		const user = requireUser(cookies);
		console.log('[openweight] POST /api/entries - user authenticated:', user.username);
		
		const body = await request.json();
		console.log('[openweight] POST /api/entries - body:', body);

		const entry = database.entries.create({
			userId: user.id,
			weight: body.weight,
			weightUnit: body.weightUnit,
			date: body.date,
			notes: body.notes,
			measurements: body.measurements ? JSON.stringify(body.measurements) : undefined,
			photoPath: body.photoPath
		});

		console.log('[openweight] POST /api/entries - success, id:', entry.id);
		return json(serializeEntry(entry));
	} catch (error) {
		console.error('[openweight] Entries POST error:', error);
		console.error('[openweight] Entries POST error stack:', error.stack);
		return json({ error: 'Failed to create entry', details: error.message }, { status: 400 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies }) => {
	try {
		console.log('[openweight] PUT /api/entries - checking session');
		const user = requireUser(cookies);
		console.log('[openweight] PUT /api/entries - user:', user.username);
		
		const body = await request.json();
		console.log('[openweight] PUT /api/entries - body:', body);

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
			console.log('[openweight] PUT /api/entries - entry not found');
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		console.log('[openweight] PUT /api/entries - success');
		return json(serializeEntry(entry));
	} catch (error) {
		console.error('[openweight] Entries PUT error:', error);
		return json({ error: 'Failed to update entry' }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	try {
		console.log('[openweight] DELETE /api/entries - checking session');
		const user = requireUser(cookies);
		console.log('[openweight] DELETE /api/entries - user:', user.username);
		
		const id = url.searchParams.get('id');
		console.log('[openweight] DELETE /api/entries - id:', id);

		if (!id) {
			return json({ error: 'Entry ID required' }, { status: 400 });
		}

		database.entries.delete(id, user.id);
		console.log('[openweight] DELETE /api/entries - success');
		return json({ success: true });
	} catch (error) {
		console.error('[openweight] Entries DELETE error:', error);
		return json({ error: 'Failed to delete entry' }, { status: 400 });
	}
};