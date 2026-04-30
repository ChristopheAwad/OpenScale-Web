import { json, type RequestHandler } from '@sveltejs/kit';
import { initDb, database } from '$lib/server/db';
import { requireUser, getSessionUser } from '$lib/server/auth';

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

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		console.log('[openweight] GET /api/goals - checking session');
		const user = getSessionUser(cookies);
		if (!user) {
			console.log('[openweight] GET /api/goals - unauthorized: no valid session');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('[openweight] GET /api/goals - user:', user.username);
		const rows = database.goals.getAll(user.id);
		const goals = rows.map(serializeGoal);
		return json(goals);
	} catch (error) {
		console.error('[openweight] Goals GET error:', error);
		return json({ error: 'Failed to fetch goals' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		console.log('[openweight] POST /api/goals - checking session');
		const user = requireUser(cookies);
		console.log('[openweight] POST /api/goals - user:', user.username);
		
		const body = await request.json();
		console.log('[openweight] POST /api/goals - body:', body);

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

		console.log('[openweight] POST /api/goals - success, id:', goal.id);
		return json(serializeGoal(goal));
	} catch (error) {
		console.error('[openweight] Goals POST error:', error);
		return json({ error: 'Failed to create goal' }, { status: 400 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies }) => {
	try {
		console.log('[openweight] PUT /api/goals - checking session');
		const user = requireUser(cookies);
		console.log('[openweight] PUT /api/goals - user:', user.username);
		
		const body = await request.json();
		console.log('[openweight] PUT /api/goals - body:', body);

		const goal = database.goals.update({
			id: body.id,
			userId: user.id,
			targetWeight: body.targetWeight,
			weightUnit: body.weightUnit,
			targetDate: body.targetDate,
			isActive: body.isActive
		});

		if (!goal) {
			console.log('[openweight] PUT /api/goals - goal not found');
			return json({ error: 'Goal not found' }, { status: 404 });
		}

		console.log('[openweight] PUT /api/goals - success');
		return json(serializeGoal(goal));
	} catch (error) {
		console.error('[openweight] Goals PUT error:', error);
		return json({ error: 'Failed to update goal' }, { status: 400 });
	}
};