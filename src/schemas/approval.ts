import {
	isNonEmptyString,
	isValidDate,
	isPositiveNumber,
	isNonNegativeInteger,
	isPaymentChoice,
	isRecord,
} from "../functions/helpers";
import type {
	ApprovalRequest,
	ManagerDecisionRequest,
} from "../types/approval";

export function isApprovalRequest(value: unknown): value is ApprovalRequest {
	if (!isRecord(value)) {
		return false;
	}

	return (
		isNonEmptyString(value.memberNumber) &&
		isValidDate(value.pastDueDate) &&
		isPositiveNumber(value.pastDueBalance) &&
		isPositiveNumber(value.monthlyPayment) &&
		isNonNegativeInteger(value.regularDefermentCount) &&
		isPaymentChoice(value.paymentChoice)
	);
}

export function isManagerDecisionRequest(
	value: unknown,
): value is ManagerDecisionRequest {
	if (!isRecord(value)) {
		return false;
	}

	const hasValidStatus =
		value.status === "approved" || value.status === "denied";

	return (
		hasValidStatus &&
		isNonEmptyString(value.reason) &&
		value.reason.trim().length <= 1000
	);
}
