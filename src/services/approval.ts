import type { ApprovalRequest, ApprovalResponse, ApprovalStatus } from '../types/approval';

function toCents(amount: number): number {
	return Math.round(amount * 100);
}

function toDollars(cents: number): number {
	return cents / 100;
}

export function evaluateApproval(request: ApprovalRequest): ApprovalResponse {
	const pastDueBalance = toCents(request.pastDueBalance);
	const monthlyPayment = toCents(request.monthlyPayment);

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

	if (request.daysPastDue >= 90) {
		denialReasons.push('The loan is 90 or more days past due.');
	} else if (request.daysPastDue >= 31) {
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

	return {
		status,
		planPayment: toDollars(planPayment),
		catchUpAmount: toDollars(Math.max(catchUpAmount, 0)),
		numberOfPayments,
		finalPayment: toDollars(monthlyPayment + Math.max(finalCatchUpAmount, 0)),
		regularDefermentAvailable: request.regularDefermentCount < 2,
		reasons,
	};
}
