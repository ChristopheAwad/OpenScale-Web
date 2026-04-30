import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
	duration?: number;
}

const toasts = writable<Toast[]>([]);
let nextId = 0;

export function addToast(message: string, type: ToastType = 'info', duration = 3000) {
	const id = nextId++;
	toasts.update((all) => [...all, { id, message, type, duration }]);

	if (duration > 0) {
		setTimeout(() => {
			removeToast(id);
		}, duration);
	}
}

export function removeToast(id: number) {
	toasts.update((all) => all.filter((t) => t.id !== id));
}

export { toasts };
