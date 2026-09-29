import { calculateDaysPastDue, toCents, toDollars } from '../functions/helpers';
import type { ApprovalDecision, ApprovalRequest, ApprovalStatus } from '../types/approval';

export function evaluateApproval(request: ApprovalRequest): ApprovalDecision {
	const pastDueBalance = toCents(request.pastDueBalance);
	const monthlyPayment = toCents(request.monthlyPayment);
	const daysPastDue = calculateDaysPastDue(request.pastDueDate);

	const planPayment =
		request.paymentChoice.type === 'minimum_plus_extra'
			? monthlyPayment + toCents(request.paymentChoice.extraAmount)
			: toCents(request.paymentChoice.affordablePayment);

	const catchUpAmount = planPayment - monthlyPayment;
	const denialReasons: string[] = [];
	const reviewReasons: string[] = [];

	if (catchUpAmount <= 0) {
		denialReasons.push('The proposed payment must exceed the regular monthly payment.');
	}

	const numberOfPayments = catchUpAmount > 0 ? Math.ceil(pastDueBalance / catchUpAmount) : 0;

	if (daysPastDue >= 90) {
		denialReasons.push('The loan is 90 or more days past due.');
	} else if (daysPastDue >= 31) {
		reviewReasons.push('The loan is between 31 and 89 days past due.');
	}

	if (numberOfPayments > 18) {
		denialReasons.push('The plan requires more than 18 payments.');
	} else if (numberOfPayments > 12) {
		reviewReasons.push('The plan requires between 13 and 18 payments.');
	}

	let status: ApprovalStatus;
	let reasons: string[];

	if (denialReasons.length > 0) {
		status = 'denied';
		reasons = denialReasons;
	} else if (reviewReasons.length > 0) {
		status = 'manager_review';
		reasons = reviewReasons;
	} else {
		status = 'approved';
		reasons = ['All automatic approval criteria were met.'];
	}

	const finalCatchUpAmount = numberOfPayments > 0 ? pastDueBalance - catchUpAmount * (numberOfPayments - 1) : 0;

	const finalPayment = monthlyPayment + Math.max(finalCatchUpAmount, 0);
	const regularDefermentAvailable = request.regularDefermentCount < 2;
	const statusLabel = status === 'manager_review' ? 'MANAGER REVIEW' : status.toUpperCase();

	const accountComment = [
		`Payment plan decision: ${statusLabel}.`,
		`Member number: ${request.memberNumber}.`,
		`Past due date: ${request.pastDueDate}.`,
		`Days past due: ${daysPastDue}.`,
		`Plan payment: ${toDollars(planPayment).toFixed(2)}.`,
		`Number of payments: ${numberOfPayments}.`,
		`Final payment: ${toDollars(finalPayment).toFixed(2)}.`,
		`Regular deferment: ${regularDefermentAvailable ? 'available' : 'not available'}.`,
		`Reason: ${reasons.join(' ')}`,
	].join(' ');

	return {
		status,
		daysPastDue,
		planPayment: toDollars(planPayment),
		catchUpAmount: toDollars(Math.max(catchUpAmount, 0)),
		numberOfPayments,
		finalPayment: toDollars(finalPayment),
		regularDefermentAvailable,
		reasons,
		accountComment,
	};
}
