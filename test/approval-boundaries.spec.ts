import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

async function getDecision(daysPastDue: number, pastDueBalance: number) {
	const response = await SELF.fetch('https://example.com/api/approval', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			pastDueBalance,
			monthlyPayment: 300,
			daysPastDue,
			regularDefermentCount: 0,
			paymentChoice: {
				type: 'minimum_plus_extra',
				extraAmount: 100,
			},
		}),
	});

	return response.json();
}

describe('days-past-due boundaries', () => {
	it.each([
		[30, 'approved'],
		[31, 'manager_review'],
		[89, 'manager_review'],
		[90, 'denied'],
	])('returns %s days past due as %s', async (daysPastDue, expectedStatus) => {
		const result = await getDecision(daysPastDue, 600);

		expect(result.status).toBe(expectedStatus);
	});
});

describe('payment-count boundaries', () => {
	it.each([
		[1200, 12, 'approved'],
		[1300, 13, 'manager_review'],
		[1800, 18, 'manager_review'],
		[1900, 19, 'denied'],
	])('evaluates a $%s balance as %s payments with status %s', async (pastDueBalance, expectedPayments, expectedStatus) => {
		const result = await getDecision(20, pastDueBalance);

		expect(result.numberOfPayments).toBe(expectedPayments);
		expect(result.status).toBe(expectedStatus);
	});
});
