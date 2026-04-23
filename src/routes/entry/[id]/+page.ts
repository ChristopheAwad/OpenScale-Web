import { error } from '@sveltejs/kit';
import { getEntries } from '$lib/stores';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const entry = getEntries().find((e) => e.id === params.id);
	if (!entry) {
		error(404, 'Entry not found');
	}
	return { entry };
};