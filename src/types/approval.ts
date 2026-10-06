import type { FormEvent } from "react";

export type AppView =
	| "new-review"
	| "manager-queue"
	| "submissions"
	| "admin-dashboard";

export type UserRole = "collector" | "manager" | "admin";

export interface AppUser {
	email: string;
	displayName: string | null;
	badgePhoto: string | null;
	role: UserRole;
}

export interface IdentityResponse {
	email: string;
	displayName: string;
	badgePhoto: string | null;
	role: UserRole;
}

export interface ApiErrorResponse {
	error: string;
}

export type AuthenticationResult =
	| { ok: true; email: string }
	| { ok: false; response: Response };

export type ManagerAuthorizationResult =
	| { ok: true; user: AppUser }
	| { ok: false; response: Response };

export type AdminAuthorizationResult =
	| { ok: true; user: AppUser }
	| { ok: false; response: Response };

export interface ApprovalCriteria {
	versionId: number;
	maxRegularDefermentCount: number;
	defermentMonths: number;
	defermentDaysReduction: number;
	automaticApprovalMaxDays: number;
	denialDaysThreshold: number;
	automaticApprovalMaxPayments: number;
	maxPlanPayments: number;
	changeReason: string | null;
	changedBy: string | null;
	changedAt: string;
}

export interface ApprovalCriteriaResponse {
	criteria: ApprovalCriteria;
}

export interface ApprovalCriteriaHistoryResponse {
	versions: ApprovalCriteria[];
}

export interface UpdateApprovalCriteriaRequest {
	maxRegularDefermentCount: number;
	defermentMonths: number;
	defermentDaysReduction: number;
	automaticApprovalMaxDays: number;
	denialDaysThreshold: number;
	automaticApprovalMaxPayments: number;
	maxPlanPayments: number;
	changeReason: string;
}

export interface SaveApprovalCriteriaInput extends UpdateApprovalCriteriaRequest {
	changedBy: string;
}

export interface ApprovalCriteriaRow {
	id: number;
	max_regular_deferment_count: number;
	deferment_months: number;
	deferment_days_reduction: number;
	automatic_approval_max_days: number;
	denial_days_threshold: number;
	automatic_approval_max_payments: number;
	max_plan_payments: number;
	change_reason: string | null;
	changed_by: string | null;
	changed_at: string;
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

export type ApprovalFormField =
	| "memberNumber"
	| "pastDueDate"
	| "pastDueBalance"
	| "monthlyPayment"
	| "regularDefermentCount"
	| "paymentAmount";

export type ApprovalValidationErrors = Partial<
	Record<ApprovalFormField, string>
>;

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
	associateBadgePhoto: string | null;
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
	associateBadgePhoto: string | null;
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

export interface SubmissionFiltersProps {
	filters: SubmissionFilters;
	sortBy: SubmissionSortField;
	sortDirection: SortDirection;
	onApply: (event: FormEvent<HTMLFormElement>) => void;
	onChange: (filters: SubmissionFilters) => void;
	onClear: () => void;
	onSortByChange: (sortBy: SubmissionSortField) => void;
	onSortDirectionChange: (direction: SortDirection) => void;
}

export interface SubmissionsTableProps {
	submissions: ApprovalSubmission[];
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	onViewComment: (submission: ApprovalSubmission) => void;
}

export interface AccountCommentModalProps {
	submission: ApprovalSubmission;
	onClose: () => void;
}

export interface LoadingIndicatorProps {
	label: string;
	detail?: string;
	compact?: boolean;
}

export interface DecisionStatusIconProps {
	status: ApprovalStatus;
}

export interface PlanCalculationLoaderProps {
	values: ReviewFormValues;
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
	associate_badge_photo: string | null;
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
	associate_badge_photo: string | null;
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
	badge_photo: string | null;
	role: UserRole;
}

export interface AssociateIdentityProps {
	displayName: string;
	badgePhoto: string | null;
}

export type ReviewFormValues = ApprovalRequest;

export interface AppHeaderProps {
	activeView: AppView;
	isIdentityLoading: boolean;
	userDisplayName: string;
	userBadgePhoto: string | null;
	showManagerQueue: boolean;
	showAdminDashboard: boolean;
	onViewChange: (view: AppView) => void;
}

export interface ReviewFormProps {
	isSubmitting: boolean;
	maxRegularDefermentCount: number;
	onSubmit: (values: ReviewFormValues) => Promise<void>;
	onClear: () => void;
}

export interface AdminCriteriaDashboardProps {
	onCriteriaUpdated: (criteria: ApprovalCriteria) => void;
}

export interface DecisionPanelProps {
	calculationValues: ReviewFormValues | null;
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

export type CriteriaNumberField = Exclude<
	keyof UpdateApprovalCriteriaRequest,
	"changeReason"
>;
