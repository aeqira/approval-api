import { calculateDaysPastDue, toCents, toDollars } from "../functions/helpers";
import type {
	ApprovalCriteria,
	ApprovalDecision,
	ApprovalRequest,
	ApprovalStatus,
} from "../types/approval";

export function evaluateApproval(
	request: ApprovalRequest,
	criteria: ApprovalCriteria,
): ApprovalDecision {
	const pastDueBalance = toCents(request.pastDueBalance);
	const monthlyPayment = toCents(request.monthlyPayment);
	const daysPastDue = calculateDaysPastDue(request.pastDueDate);
	const regularDefermentAvailable =
		request.regularDefermentCount < criteria.maxRegularDefermentCount;
	const regularDefermentApplied = regularDefermentAvailable;
	const defermentMonths = regularDefermentApplied
		? criteria.defermentMonths
		: 0;
	const deferredAmount = regularDefermentApplied
		? Math.min(pastDueBalance, monthlyPayment * defermentMonths)
		: 0;
	const adjustedPastDueBalance = pastDueBalance - deferredAmount;
	const adjustedDaysPastDue = regularDefermentApplied
		? Math.max(0, daysPastDue - criteria.defermentDaysReduction)
		: daysPastDue;
	const defermentOnlyApproval =
		regularDefermentApplied &&
		adjustedPastDueBalance === 0 &&
		adjustedDaysPastDue === 0;
	const proposedPlanPayment =
		request.paymentChoice.type === "minimum_plus_extra"
			? monthlyPayment + toCents(request.paymentChoice.extraAmount)
			: toCents(request.paymentChoice.affordablePayment);
	const planPayment = defermentOnlyApproval
		? monthlyPayment
		: proposedPlanPayment;
	const catchUpAmount = planPayment - monthlyPayment;
	const denialReasons: string[] = [];
	const reviewReasons: string[] = [];

	if (!defermentOnlyApproval && catchUpAmount <= 0) {
		denialReasons.push(
			"Proposed payment must exceed the regular monthly payment.",
		);
	}

	const numberOfPayments =
		catchUpAmount > 0 ? Math.ceil(adjustedPastDueBalance / catchUpAmount) : 0;

	if (adjustedDaysPastDue >= criteria.denialDaysThreshold) {
		denialReasons.push(
			`Loan remains ${criteria.denialDaysThreshold} or more days delinquent after deferment.`,
		);
	} else if (adjustedDaysPastDue > criteria.automaticApprovalMaxDays) {
		reviewReasons.push(
			`Loan remains between ${criteria.automaticApprovalMaxDays + 1} and ${
				criteria.denialDaysThreshold - 1
			} days delinquent after deferment.`,
		);
	}

	if (numberOfPayments > criteria.maxPlanPayments) {
		denialReasons.push(
			`Plan requires more than ${criteria.maxPlanPayments} payments.`,
		);
	} else if (numberOfPayments > criteria.automaticApprovalMaxPayments) {
		reviewReasons.push(
			`Plan requires between ${
				criteria.automaticApprovalMaxPayments + 1
			} and ${criteria.maxPlanPayments} payments.`,
		);
	}

	let status: ApprovalStatus;
	let reasons: string[];

	if (defermentOnlyApproval) {
		status = "approved";
		reasons = [
			`Approved for ${criteria.defermentMonths}-month deferment only; no payment plan is required.`,
		];
	} else if (denialReasons.length > 0) {
		status = "denied";
		reasons = denialReasons;
	} else if (reviewReasons.length > 0) {
		status = "manager_review";
		reasons = reviewReasons;
	} else {
		status = "approved";
		reasons = ["All automatic approval criteria were met."];
	}

	const finalCatchUpAmount =
		numberOfPayments > 0
			? adjustedPastDueBalance - catchUpAmount * (numberOfPayments - 1)
			: 0;
	const finalPayment = defermentOnlyApproval
		? monthlyPayment
		: monthlyPayment + Math.max(finalCatchUpAmount, 0);
	const statusLabel =
		status === "manager_review" ? "MANAGER REVIEW" : status.toUpperCase();
	const accountComment = [
		`Payment plan decision: ${statusLabel}.`,
		`Member number: ${request.memberNumber}.`,
		`Due date: ${request.pastDueDate}.`,
		`Original days delinquent: ${daysPastDue}.`,
		`Adjusted days delinquent: ${adjustedDaysPastDue}.`,
		`Original delinquent balance: $${toDollars(pastDueBalance).toFixed(2)}.`,
		`Adjusted delinquent balance: $${toDollars(adjustedPastDueBalance).toFixed(2)}.`,
		regularDefermentApplied
			? `Regular deferment applied for ${defermentMonths} months; $${toDollars(deferredAmount).toFixed(2)} deferred.`
			: "Regular deferment not available.",
		`Plan payment: $${toDollars(planPayment).toFixed(2)}.`,
		`Payment count: ${numberOfPayments}.`,
		`Final payment: $${toDollars(finalPayment).toFixed(2)}.`,
		`Decision reason: ${reasons.join(" ")}`,
	].join(" ");

	return {
		status,
		daysPastDue,
		adjustedDaysPastDue,
		adjustedPastDueBalance: toDollars(adjustedPastDueBalance),
		planPayment: toDollars(planPayment),
		catchUpAmount: toDollars(Math.max(catchUpAmount, 0)),
		numberOfPayments,
		finalPayment: toDollars(finalPayment),
		regularDefermentAvailable,
		regularDefermentApplied,
		defermentMonths,
		deferredAmount: toDollars(deferredAmount),
		reasons,
		accountComment,
	};
}
