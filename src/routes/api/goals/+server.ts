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
		const user = getSessionUser(cookies);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const rows = database.goals.getAll(user.id);
		const goals = rows.map(serializeGoal);
		return json(goals);
	} catch (error) {
		console.error('Goals GET error:', error);
		return json({ error: 'Failed to fetch goals' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
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

		return json(serializeGoal(goal));
	} catch (error) {
		console.error('Goals POST error:', error);
		return json({ error: 'Failed to create goal' }, { status: 400 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies }) => {
	try {
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
			return json({ error: 'Goal not found' }, { status: 404 });
		}

		return json(serializeGoal(goal));
	} catch (error) {
		console.error('Goals PUT error:', error);
		return json({ error: 'Failed to update goal' }, { status: 400 });
	}
};