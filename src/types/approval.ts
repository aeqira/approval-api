export type AppView = "new-review" | "manager-queue" | "submissions";

export type UserRole = "associate" | "manager";

export interface AppUser {
	email: string;
	displayName: string | null;
	role: UserRole;
}

export interface IdentityResponse {
	email: string;
	displayName: string;
	role: UserRole;
}

export interface ApiErrorResponse {
	error: string;
}

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

export type SubmissionSortField =
	| "createdAt"
	| "memberNumber"
	| "status"
	| "daysPastDue"
	| "pastDueBalance"
	| "numberOfPayments";

export type SortDirection = "asc" | "desc";

export interface SubmissionFilters {
	search: string;
	status: "" | ApprovalStatus;
	defermentApplied: "" | "true" | "false";
	dateFrom: string;
	dateTo: string;
}

export interface ListSubmissionsInput {
	search?: string;
	status?: ApprovalStatus;
	defermentApplied?: boolean;
	dateFrom?: string;
	dateTo?: string;
	sortBy: SubmissionSortField;
	sortDirection: SortDirection;
	page: number;
	pageSize: number;
}

export interface SubmissionRow {
	id: string;
	member_number: string;
	associate_email: string;
	associate_display_name: string;
	past_due_date: string;
	days_past_due: number;
	adjusted_days_past_due: number;
	past_due_balance_cents: number;
	adjusted_past_due_balance_cents: number;
	monthly_payment_cents: number;
	plan_payment_cents: number;
	number_of_payments: number;
	regular_deferment_applied: number;
	deferment_months: number;
	deferred_amount_cents: number;
	initial_status: ApprovalStatus;
	current_status: ApprovalStatus;
	reasons_json: string;
	manager_email: string | null;
	manager_reason: string | null;
	reviewed_at: string | null;
	created_at: string;
	account_comment: string;
}

export interface SubmissionCountRow {
	total: number;
}

export interface SaveApprovalReviewInput {
	associateEmail: string;
	request: ApprovalRequest;
	decision: ApprovalDecision;
}

export interface ManagerReviewRow {
	id: string;
	member_number: string;
	associate_email: string;
	associate_display_name: string;
	past_due_date: string;
	days_past_due: number;
	adjusted_days_past_due: number;
	past_due_balance_cents: number;
	adjusted_past_due_balance_cents: number;
	monthly_payment_cents: number;
	plan_payment_cents: number;
	number_of_payments: number;
	regular_deferment_available: number;
	regular_deferment_applied: number;
	deferment_months: number;
	deferred_amount_cents: number;
	reasons_json: string;
	created_at: string;
}

export interface ResolveManagerReviewInput {
	reviewId: string;
	status: ManagerDecisionStatus;
	managerEmail: string;
	managerDisplayName: string;
	managerReason: string;
}

export interface PendingReviewRow {
	account_comment: string;
}

export interface UserRow {
	email: string;
	display_name: string | null;
	role: UserRole;
}

export type ReviewFormValues = ApprovalRequest;

export interface AppHeaderProps {
	activeView: AppView;
	userDisplayName: string;
	showManagerQueue: boolean;
	onViewChange: (view: AppView) => void;
}

export interface ReviewFormProps {
	isSubmitting: boolean;
	onSubmit: (values: ReviewFormValues) => Promise<void>;
	onClear: () => void;
}

export interface DecisionPanelProps {
	error: string | null;
	isSubmitting: boolean;
	result: ApprovalResponse | null;
}

export interface ManagerDecisionControlProps {
	reviewId: string;
	onResolved: (decision: ManagerDecisionResponse) => void;
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
