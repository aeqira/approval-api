import type { ApprovalResponse, PaymentChoice } from '../types/approval';

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(value);
}

export function getStatusLabel(status: ApprovalResponse['status']): string {
	if (status === 'manager_review') {
		return 'Manager Review';
	}

	return status === 'approved' ? 'Approved' : 'Denied';
}

export function jsonNoStore(body: unknown, status: number = 200): Response {
	return Response.json(body, {
		status,
		headers: {
			'Cache-Control': 'no-store',
		},
	});
}

export function isPositiveNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isNonNegativeInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

export function isValidDate(value: unknown): value is string {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const parsedDate = new Date(`${value}T00:00:00Z`);

	if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== value) {
		return false;
	}

	const now = new Date();
	const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

	return parsedDate.getTime() <= today;
}

export function isPaymentChoice(value: unknown): value is PaymentChoice {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const choice = value as Record<string, unknown>;

	if (choice.type === 'minimum_plus_extra') {
		return isPositiveNumber(choice.extraAmount);
	}

	if (choice.type === 'affordable_payment') {
		return isPositiveNumber(choice.affordablePayment);
	}

	return false;
}

export function toCents(amount: number): number {
	return Math.round(amount * 100);
}

export function toDollars(cents: number): number {
	return cents / 100;
}

export function calculateDaysPastDue(pastDueDate: string): number {
	const dueDate = new Date(`${pastDueDate}T00:00:00Z`);
	const now = new Date();

	const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

	const difference = today - dueDate.getTime();
	const millisecondsPerDay = 24 * 60 * 60 * 1000;

	return Math.max(0, Math.floor(difference / millisecondsPerDay));
}
