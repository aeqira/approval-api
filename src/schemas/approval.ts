import {
	isNonEmptyString,
	isValidDate,
	isPositiveNumber,
	isNonNegativeInteger,
	isPaymentChoice,
} from "../functions/helpers";
import type {
	ApprovalRequest,
	ManagerDecisionRequest,
} from "../types/approval";

export function isApprovalRequest(value: unknown): value is ApprovalRequest {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const request = value as Record<string, unknown>;

	return (
		isNonEmptyString(request.memberNumber) &&
		isValidDate(request.pastDueDate) &&
		isPositiveNumber(request.pastDueBalance) &&
		isPositiveNumber(request.monthlyPayment) &&
		isNonNegativeInteger(request.regularDefermentCount) &&
		isPaymentChoice(request.paymentChoice)
	);
}

export function isManagerDecisionRequest(
	value: unknown,
): value is ManagerDecisionRequest {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const request = value as Record<string, unknown>;

	const hasValidStatus =
		request.status === "approved" || request.status === "denied";

	return (
		hasValidStatus &&
		isNonEmptyString(request.reason) &&
		request.reason.trim().length <= 1000
	);
}
