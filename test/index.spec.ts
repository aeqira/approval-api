import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('Approval API', () => {
	it('returns its health status', async () => {
		const response = await SELF.fetch('https://example.com/');

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			name: 'Approval API',
			status: 'running',
		});
	});

	it('processes multiple inputs', async () => {
		const response = await SELF.fetch('https://example.com/api/approval', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				inputs: ['first request', 'second request', 'third request'],
			}),
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			outputs: ['FIRST REQUEST', 'SECOND REQUEST', 'THIRD REQUEST'],
		});
	});

	it('rejects invalid input', async () => {
		const response = await SELF.fetch('https://example.com/api/approval', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ inputs: [] }),
		});

		expect(response.status).toBe(400);
	});
});
