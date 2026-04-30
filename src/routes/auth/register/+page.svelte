<script lang="ts">
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/stores/toast';

	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleRegister(e: Event) {
		e.preventDefault();
		error = '';
		success = false;

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			addToast(error, 'error');
			return;
		}

		if (password.length < 4) {
			error = 'Password must be at least 4 characters';
			addToast(error, 'error');
			return;
		}

		loading = true;
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Registration failed';
				addToast(error, 'error');
			} else {
				success = true;
				addToast('Account created successfully! Redirecting to login...', 'success');
				setTimeout(() => {
					goto('/auth/login');
				}, 1500);
			}
		} catch {
			error = 'Network error';
			addToast('Network error. Please try again.', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-container">
	<h1 class="text-2xl font-bold text-center mb-6">Create Account</h1>

	{#if success}
		<div class="alert alert-success">
			Account created! Redirecting to login...
		</div>
	{/if}

	{#if error}
		<div class="alert alert-error">
			{error}
		</div>
	{/if}

	<form onsubmit={handleRegister} class="card space-y-4">
		<div>
			<label class="label block mb-2" for="username">Username</label>
			<input
				id="username"
				type="text"
				bind:value={username}
				class="input-custom"
				required
				minlength="3"
				autocomplete="username"
			/>
		</div>

		<div>
			<label class="label block mb-2" for="password">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				class="input-custom"
				required
				minlength="4"
				autocomplete="new-password"
			/>
		</div>

		<div>
			<label class="label block mb-2" for="confirmPassword">Confirm Password</label>
			<input
				id="confirmPassword"
				type="password"
				bind:value={confirmPassword}
				class="input-custom"
				required
				minlength="4"
				autocomplete="new-password"
			/>
		</div>

		<button type="submit" class="btn-custom btn-primary-custom w-full" disabled={loading}>
			{loading ? 'Creating...' : 'Create Account'}
		</button>
	</form>

	<p class="text-center mt-4">
		Already have an account? <a href="/auth/login" class="link">Login</a>
	</p>
</div>