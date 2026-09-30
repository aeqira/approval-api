import { calculateDaysPastDue, toCents, toDollars } from "../functions/helpers";
import type {
	ApprovalDecision,
	ApprovalRequest,
	ApprovalStatus,
} from "../types/approval";

export function evaluateApproval(request: ApprovalRequest): ApprovalDecision {
	const pastDueBalance = toCents(request.pastDueBalance);
	const monthlyPayment = toCents(request.monthlyPayment);
	const daysPastDue = calculateDaysPastDue(request.pastDueDate);
	const regularDefermentAvailable = request.regularDefermentCount < 2;
	const regularDefermentApplied = regularDefermentAvailable;
	const defermentMonths = regularDefermentApplied ? 3 : 0;
	const deferredAmount = regularDefermentApplied
		? Math.min(pastDueBalance, monthlyPayment * defermentMonths)
		: 0;
	const adjustedPastDueBalance = pastDueBalance - deferredAmount;
	const adjustedDaysPastDue = regularDefermentApplied
		? Math.max(0, daysPastDue - 90)
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
			"The proposed payment must exceed the regular monthly payment.",
		);
	}

	const numberOfPayments =
		catchUpAmount > 0 ? Math.ceil(adjustedPastDueBalance / catchUpAmount) : 0;

	if (adjustedDaysPastDue >= 90) {
		denialReasons.push(
			"The loan remains 90 or more days delinquent after deferment.",
		);
	} else if (adjustedDaysPastDue >= 31) {
		reviewReasons.push(
			"The loan remains between 31 and 89 days delinquent after deferment.",
		);
	}

	if (numberOfPayments > 18) {
		denialReasons.push("The plan requires more than 18 payments.");
	} else if (numberOfPayments > 12) {
		reviewReasons.push("The plan requires between 13 and 18 payments.");
	}

	let status: ApprovalStatus;
	let reasons: string[];

	if (defermentOnlyApproval) {
		status = "approved";
		reasons = [
			"Approved for 3-month deferment only; no payment plan is required.",
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
