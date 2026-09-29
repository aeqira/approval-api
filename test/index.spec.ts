import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import type { ApprovalResponse } from '../src/types/approval';

async function submitApproval(body: unknown) {
	return SELF.fetch('https://example.com/api/approval', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});
}

async function readApprovalResponse(response: Response): Promise<ApprovalResponse> {
	return (await response.json()) as ApprovalResponse;
}

describe('Approval API', () => {
	it('approves an eligible minimum-plus-extra plan', async () => {
		const response = await submitApproval({
			pastDueBalance: 600,
			monthlyPayment: 300,
			daysPastDue: 20,
			regularDefermentCount: 1,
			paymentChoice: {
				type: 'minimum_plus_extra',
				extraAmount: 100,
			},
		});

		expect(response.headers.get('Cache-Control')).toBe('no-store');
		expect(response.status).toBe(200);

		const result = await readApprovalResponse(response);

		expect(result).toEqual({
			status: 'approved',
			planPayment: 400,
			catchUpAmount: 100,
			numberOfPayments: 6,
			finalPayment: 400,
			regularDefermentAvailable: true,
			reasons: ['All automatic approval criteria were met.'],
		});
	});

	it('sends 31–89 days past due to manager review', async () => {
		const response = await submitApproval({
			pastDueBalance: 600,
			monthlyPayment: 300,
			daysPastDue: 45,
			regularDefermentCount: 2,
			paymentChoice: {
				type: 'minimum_plus_extra',
				extraAmount: 100,
			},
		});

		const result = await readApprovalResponse(response);

		expect(result.status).toBe('manager_review');
		expect(result.regularDefermentAvailable).toBe(false);
		expect(result.reasons).toContain('The loan is between 31 and 89 days past due.');
	});

	it('sends a 13–18 payment plan to manager review', async () => {
		const response = await submitApproval({
			pastDueBalance: 1300,
			monthlyPayment: 300,
			daysPastDue: 20,
			regularDefermentCount: 0,
			paymentChoice: {
				type: 'minimum_plus_extra',
				extraAmount: 100,
			},
		});

		const result = await readApprovalResponse(response);

		expect(result.status).toBe('manager_review');
		expect(result.numberOfPayments).toBe(13);
	});

	it('denies plans requiring more than 18 payments', async () => {
		const response = await submitApproval({
			pastDueBalance: 1900,
			monthlyPayment: 300,
			daysPastDue: 20,
			regularDefermentCount: 0,
			paymentChoice: {
				type: 'minimum_plus_extra',
				extraAmount: 100,
			},
		});

		const result = await readApprovalResponse(response);

		expect(result.status).toBe('denied');
		expect(result.reasons).toContain('The plan requires more than 18 payments.');
	});

	it('denies an affordable payment that does not exceed the minimum', async () => {
		const response = await submitApproval({
			pastDueBalance: 600,
			monthlyPayment: 300,
			daysPastDue: 20,
			regularDefermentCount: 0,
			paymentChoice: {
				type: 'affordable_payment',
				affordablePayment: 300,
			},
		});

		const result = await readApprovalResponse(response);

		expect(result.status).toBe('denied');
		expect(result.reasons).toContain('The proposed payment must exceed the regular monthly payment.');
	});
});
