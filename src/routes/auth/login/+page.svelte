<script lang="ts">
	import { goto } from '$app/navigation';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Login failed';
			} else {
				goto('/');
			}
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container">
	<h1 class="h1">Login</h1>

	{#if error}
		<div class="alert alert-error">
			{error}
		</div>
	{/if}

	<form onsubmit={handleLogin} class="card space-y-4">
		<div>
			<label class="label block mb-2" for="username">Username</label>
			<input
				id="username"
				type="text"
				bind:value={username}
				class="input"
				required
				autocomplete="username"
			/>
		</div>

		<div>
			<label class="label block mb-2" for="password">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				class="input"
				required
				autocomplete="current-password"
			/>
		</div>

		<button type="submit" class="btn btn-primary w-full" disabled={loading}>
			{loading ? 'Logging in...' : 'Login'}
		</button>
	</form>

	<p class="text-center mt-4">
		Don't have an account? <a href="/auth/register" class="link">Register</a>
	</p>
</div>

<style>
	.container {
		max-width: 400px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.h1 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.card {
		background: rgb(255 255 255 / 0.05);
		border: 1px solid rgb(255 255 255 / 0.1);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.space-y-4 > * + * {
		margin-top: 1rem;
	}

	.label {
		font-size: 0.875rem;
		color: rgb(255 255 255 / 0.7);
	}

	.input {
		width: 100%;
		padding: 0.75rem;
		background: rgb(0 0 0 / 0.3);
		border: 1px solid rgb(255 255 255 / 0.1);
		border-radius: 0.375rem;
		color: white;
		font-size: 1rem;
	}

	.input:focus {
		outline: none;
		border-color: rgb(168 85 247 / 0.5);
	}

	.btn {
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: rgb(168 85 247);
		color: white;
		border: none;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.w-full {
		width: 100%;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
	}

	.alert-error {
		background: rgb(239 68 68 / 0.2);
		border: 1px solid rgb(239 68 68 / 0.3);
		color: rgb(252 165 165);
	}

	.text-center {
		text-align: center;
	}

	.mt-4 {
		margin-top: 1rem;
	}

	.link {
		color: rgb(168 85 247);
		text-decoration: underline;
	}
</style>