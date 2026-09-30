export type AppView = "new-review" | "manager-queue" | "submissions";

export type PaymentChoice =
	| {
			type: "minimum_plus_extra";
			extraAmount: number;
	  }
	| {
			type: "affordable_payment";
			affordablePayment: number;
	  };

export interface ApprovalRequest {
	memberNumber: string;
	pastDueDate: string;
	pastDueBalance: number;
	monthlyPayment: number;
	regularDefermentCount: number;
	paymentChoice: PaymentChoice;
}

export type ApprovalStatus = "approved" | "denied" | "manager_review";

export interface ApprovalDecision {
	status: ApprovalStatus;
	daysPastDue: number;
	adjustedDaysPastDue: number;
	adjustedPastDueBalance: number;
	planPayment: number;
	catchUpAmount: number;
	numberOfPayments: number;
	finalPayment: number;
	regularDefermentAvailable: boolean;
	regularDefermentApplied: boolean;
	defermentMonths: number;
	deferredAmount: number;
	reasons: string[];
	accountComment: string;
}

export interface ApprovalResponse extends ApprovalDecision {
	reviewId: string;
}

export interface ManagerReview {
	reviewId: string;
	memberNumber: string;
	associateEmail: string;
	associateDisplayName: string;
	pastDueDate: string;
	daysPastDue: number;
	adjustedDaysPastDue: number;
	pastDueBalance: number;
	adjustedPastDueBalance: number;
	monthlyPayment: number;
	planPayment: number;
	numberOfPayments: number;
	regularDefermentAvailable: boolean;
	regularDefermentApplied: boolean;
	defermentMonths: number;
	deferredAmount: number;
	reasons: string[];
	createdAt: string;
}

export interface ManagerReviewsResponse {
	reviews: ManagerReview[];
}

export type ManagerDecisionStatus = "approved" | "denied";

export interface ManagerDecisionRequest {
	status: ManagerDecisionStatus;
	reason: string;
}

export interface ApprovalSubmission {
	reviewId: string;
	memberNumber: string;
	associateEmail: string;
	associateDisplayName: string;
	pastDueDate: string;
	daysPastDue: number;
	adjustedDaysPastDue: number;
	pastDueBalance: number;
	adjustedPastDueBalance: number;
	monthlyPayment: number;
	planPayment: number;
	numberOfPayments: number;
	regularDefermentApplied: boolean;
	defermentMonths: number;
	deferredAmount: number;
	initialStatus: ApprovalStatus;
	currentStatus: ApprovalStatus;
	reasons: string[];
	managerEmail: string | null;
	managerReason: string | null;
	reviewedAt: string | null;
	createdAt: string;
	accountComment: string;
}

export interface ApprovalSubmissionsResponse {
	submissions: ApprovalSubmission[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface ManagerDecisionResponse {
	reviewId: string;
	status: ManagerDecisionStatus;
	managerEmail: string;
	managerDisplayName: string;
	managerReason: string;
	accountComment: string;
	reviewedAt: string;
}
