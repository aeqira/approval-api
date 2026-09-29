import type { ApprovalRequest, PaymentChoice } from '../types/approval';

function isPositiveNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isPaymentChoice(value: unknown): value is PaymentChoice {
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

export function isApprovalRequest(value: unknown): value is ApprovalRequest {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const request = value as Record<string, unknown>;

	return (
		isPositiveNumber(request.pastDueBalance) &&
		isPositiveNumber(request.monthlyPayment) &&
		isNonNegativeInteger(request.daysPastDue) &&
		isNonNegativeInteger(request.regularDefermentCount) &&
		isPaymentChoice(request.paymentChoice)
	);
}
