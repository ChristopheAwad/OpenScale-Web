import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { requireUser, getSessionUser } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { dev } from '$app/environment';
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

export const GET: RequestHandler = async ({ cookies, locals }) => {
	try {
		logger.debug('GET /api/entries - checking session', { requestId: locals.requestId });
		const user = getSessionUser(cookies);
		if (!user) {
			logger.debug('GET /api/entries - unauthorized: no valid session', { requestId: locals.requestId });
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		logger.debug('GET /api/entries - user', { requestId: locals.requestId, userId: user.id });
		const rows = database.entries.getAll(user.id);
		const entries = rows.map(serializeEntry);
		return json(entries);
	} catch (error) {
		logger.error('Entries GET error', error instanceof Error ? error : new Error(String(error)), { requestId: locals?.requestId });
		return json({ error: 'Failed to fetch entries' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	try {
		logger.debug('POST /api/entries - checking session', { requestId: locals.requestId });
		
		const user = requireUser(cookies);
		logger.debug('POST /api/entries - authenticated', { requestId: locals.requestId, userId: user.id });
		
		const body = await request.json();
		
		// Validate required fields
		if (!body.weight && body.weight !== 0) {
			return json({ 
				error: 'Failed to create entry', 
				details: 'Weight is required' 
			}, { status: 400 });
		}

		const weight = parseFloat(body.weight);
		if (isNaN(weight) || weight <= 0) {
			return json({ 
				error: 'Failed to create entry', 
				details: 'Weight must be a positive number' 
			}, { status: 400 });
		}

		if (!body.date) {
			return json({ 
				error: 'Failed to create entry', 
				details: 'Date is required' 
			}, { status: 400 });
		}

		// Validate date format (YYYY-MM-DD)
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(body.date)) {
			return json({ 
				error: 'Failed to create entry', 
				details: 'Date must be in YYYY-MM-DD format' 
			}, { status: 400 });
		}

		// Validate weight unit
		const validWeightUnits = ['kg', 'lbs'];
		if (!body.weightUnit || !validWeightUnits.includes(body.weightUnit)) {
			return json({ 
				error: 'Failed to create entry', 
				details: 'Invalid weight unit. Must be "kg" or "lbs"' 
			}, { status: 400 });
		}
		
		// Ensure measurements is a JSON string for DB storage
		const measurements = body.measurements ? 
			(typeof body.measurements === 'string' ? body.measurements : JSON.stringify(body.measurements)) 
			: undefined;
		
		const entry = database.entries.create({
			userId: user.id,
			weight: weight,
			weightUnit: body.weightUnit,
			date: body.date,
			notes: body.notes,
			measurements,
			photoPath: body.photoPath
		});

		logger.info('Entry created', { requestId: locals.requestId, userId: user.id, entryId: entry.id });
		return json(serializeEntry(entry));
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Entries POST error', err, { requestId: locals?.requestId });
		return json({ 
			error: 'Failed to create entry', 
			details: dev ? err.message : undefined,
			requestId: locals?.requestId 
		}, { status: 400 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies, locals }) => {
	try {
		logger.debug('PUT /api/entries - checking session', { requestId: locals.requestId });
		const user = requireUser(cookies);
		
		const body = await request.json();

		// Validate required fields
		if (!body.id) {
			return json({ 
				error: 'Failed to update entry', 
				details: 'Entry ID is required' 
			}, { status: 400 });
		}

		if (!body.weight && body.weight !== 0) {
			return json({ 
				error: 'Failed to update entry', 
				details: 'Weight is required' 
			}, { status: 400 });
		}

		const weight = parseFloat(body.weight);
		if (isNaN(weight) || weight <= 0) {
			return json({ 
				error: 'Failed to update entry', 
				details: 'Weight must be a positive number' 
			}, { status: 400 });
		}

		if (!body.date) {
			return json({ 
				error: 'Failed to update entry', 
				details: 'Date is required' 
			}, { status: 400 });
		}

		// Validate date format (YYYY-MM-DD)
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(body.date)) {
			return json({ 
				error: 'Failed to update entry', 
				details: 'Date must be in YYYY-MM-DD format' 
			}, { status: 400 });
		}

		// Validate weight unit
		const validWeightUnits = ['kg', 'lbs'];
		if (!body.weightUnit || !validWeightUnits.includes(body.weightUnit)) {
			return json({ 
				error: 'Failed to update entry', 
				details: 'Invalid weight unit. Must be "kg" or "lbs"' 
			}, { status: 400 });
		}

		const entry = database.entries.update({
			id: body.id,
			userId: user.id,
			weight: weight,
			weightUnit: body.weightUnit,
			date: body.date,
			notes: body.notes,
			measurements: body.measurements ? JSON.stringify(body.measurements) : undefined,
			photoPath: body.photoPath
		});

		if (!entry) {
			logger.debug('PUT /api/entries - entry not found', { requestId: locals.requestId, entryId: body.id });
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		logger.info('Entry updated', { requestId: locals.requestId, userId: user.id, entryId: body.id });
		return json(serializeEntry(entry));
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Entries PUT error', err, { requestId: locals?.requestId });
		return json({ error: 'Failed to update entry' }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ url, cookies, locals }) => {
	try {
		logger.debug('DELETE /api/entries - checking session', { requestId: locals.requestId });
		const user = requireUser(cookies);
		
		const id = url.searchParams.get('id');

		if (!id) {
			return json({ error: 'Entry ID required' }, { status: 400 });
		}

		database.entries.delete(id, user.id);
		logger.info('Entry deleted', { requestId: locals.requestId, userId: user.id, entryId: id });
		return json({ success: true });
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Entries DELETE error', err, { requestId: locals?.requestId });
		return json({ error: 'Failed to delete entry' }, { status: 400 });
	}
};