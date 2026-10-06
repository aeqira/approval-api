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
	ApprovalValidationErrors,
	ManagerDecisionRequest,
} from "../types/approval";

export function validateApprovalRequest(
	value: ApprovalRequest,
	maxRegularDefermentCount = 2,
): ApprovalValidationErrors {
	const errors: ApprovalValidationErrors = {};

	if (!isNonEmptyString(value.memberNumber)) {
		errors.memberNumber = "Enter a member number.";
	}

	if (!isValidDate(value.pastDueDate)) {
		errors.pastDueDate =
			"Enter a valid past-due date that is not in the future.";
	}

	if (!isPositiveNumber(value.pastDueBalance)) {
		errors.pastDueBalance = "Enter a delinquent balance greater than $0.";
	}

	if (!isPositiveNumber(value.monthlyPayment)) {
		errors.monthlyPayment = "Enter a monthly payment greater than $0.";
	}

	if (!isNonNegativeInteger(value.regularDefermentCount)) {
		errors.regularDefermentCount =
			"Enter the lifetime number of regular deferments as a whole number.";
	} else if (value.regularDefermentCount > maxRegularDefermentCount) {
		errors.regularDefermentCount = `Deferments used must be between 0 and ${maxRegularDefermentCount}.`;
	}

	if (value.paymentChoice.type === "minimum_plus_extra") {
		if (!isPositiveNumber(value.paymentChoice.extraAmount)) {
			errors.paymentAmount = "Enter an extra amount greater than $0.";
		}
	} else if (!isPositiveNumber(value.paymentChoice.affordablePayment)) {
		errors.paymentAmount = "Enter an affordable payment greater than $0.";
	} else if (
		isPositiveNumber(value.monthlyPayment) &&
		value.paymentChoice.affordablePayment <= value.monthlyPayment
	) {
		errors.paymentAmount =
			"The affordable payment must exceed the regular monthly payment.";
	}

	return errors;
}

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
