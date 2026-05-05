import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { requireUser, getSessionUser } from '$lib/server/auth';
import { logger } from '$lib/server/logger';

initDb();

function serializeGoal(row: any) {
	return {
		id: row.id,
		targetWeight: row.target_weight,
		weightUnit: row.weight_unit,
		targetDate: row.target_date || undefined,
		isActive: row.is_active === 1,
		createdAt: row.created_at
	};
}

export const GET: RequestHandler = async ({ cookies, locals }) => {
	try {
		logger.debug('GET /api/goals - checking session', { requestId: locals.requestId });
		const user = getSessionUser(cookies);
		if (!user) {
			logger.debug('GET /api/goals - unauthorized', { requestId: locals.requestId });
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		logger.debug('GET /api/goals - user', { requestId: locals.requestId, userId: user.id });
		const rows = database.goals.getAll(user.id);
		const goals = rows.map(serializeGoal);
		return json(goals);
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Goals GET error', err, { requestId: locals?.requestId });
		return json({ error: 'Failed to fetch goals' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	try {
		logger.debug('POST /api/goals - checking session', { requestId: locals.requestId });
		const user = requireUser(cookies);
		
		const body = await request.json();

		const existingActive = database.goals.getActive(user.id);
		if (existingActive && body.isActive) {
			database.goals.setActive(existingActive.id, user.id);
		}

		const goal = database.goals.create({
			userId: user.id,
			targetWeight: body.targetWeight,
			weightUnit: body.weightUnit,
			targetDate: body.targetDate
		});

		logger.info('Goal created', { requestId: locals.requestId, userId: user.id, goalId: goal.id });
		return json(serializeGoal(goal));
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Goals POST error', err, { requestId: locals?.requestId });
		return json({ error: 'Failed to create goal' }, { status: 400 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies, locals }) => {
	try {
		logger.debug('PUT /api/goals - checking session', { requestId: locals.requestId });
		const user = requireUser(cookies);
		
		const body = await request.json();

		const goal = database.goals.update({
			id: body.id,
			userId: user.id,
			targetWeight: body.targetWeight,
			weightUnit: body.weightUnit,
			targetDate: body.targetDate,
			isActive: body.isActive
		});

		if (!goal) {
			logger.debug('PUT /api/goals - goal not found', { requestId: locals.requestId, goalId: body.id });
			return json({ error: 'Goal not found' }, { status: 404 });
		}

		logger.info('Goal updated', { requestId: locals.requestId, userId: user.id, goalId: body.id });
		return json(serializeGoal(goal));
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('Goals PUT error', err, { requestId: locals?.requestId });
		return json({ error: 'Failed to update goal' }, { status: 400 });
	}
};