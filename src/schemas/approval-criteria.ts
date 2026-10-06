import {
	isIntegerBetween,
	isNonEmptyString,
	isRecord,
} from "../functions/helpers";
import type { UpdateApprovalCriteriaRequest } from "../types/approval";

export function isUpdateApprovalCriteriaRequest(
	value: unknown,
): value is UpdateApprovalCriteriaRequest {
	if (!isRecord(value)) {
		return false;
	}

	if (
		!isIntegerBetween(value.maxRegularDefermentCount, 0, 10) ||
		!isIntegerBetween(value.defermentMonths, 1, 12) ||
		!isIntegerBetween(value.defermentDaysReduction, 1, 365) ||
		!isIntegerBetween(value.automaticApprovalMaxDays, 0, 3650) ||
		!isIntegerBetween(value.denialDaysThreshold, 1, 3650) ||
		!isIntegerBetween(value.automaticApprovalMaxPayments, 1, 60) ||
		!isIntegerBetween(value.maxPlanPayments, 2, 60) ||
		!isNonEmptyString(value.changeReason) ||
		value.changeReason.trim().length > 1000
	) {
		return false;
	}

	return (
		value.denialDaysThreshold > value.automaticApprovalMaxDays &&
		value.maxPlanPayments > value.automaticApprovalMaxPayments
	);
}
