import type {
	SubmissionFilters as SubmissionFilterValues,
	SubmissionSortField,
} from "../types/approval";

export const API_BASE_URL = "/api/v1";

export const API_ROUTES = {
	adminCriteria: `${API_BASE_URL}/admin/criteria`,
	adminCriteriaHistory: `${API_BASE_URL}/admin/criteria/history`,
	approval: `${API_BASE_URL}/approval`,
	criteria: `${API_BASE_URL}/criteria`,
	health: `${API_BASE_URL}/health`,
	identity: `${API_BASE_URL}/identity`,
	managerReview: (reviewId: string) =>
		`${API_BASE_URL}/manager/reviews/${encodeURIComponent(reviewId)}`,
	managerReviews: `${API_BASE_URL}/manager/reviews`,
	submissions: `${API_BASE_URL}/submissions`,
} as const;

export const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const EMPTY_FILTERS: SubmissionFilterValues = {
	search: "",
	status: "",
	defermentApplied: "",
	dateFrom: "",
	dateTo: "",
};

export const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const ACCESS_EMAIL_HEADER = "CF-Access-Authenticated-User-Email";
export const CRITERIA_COLUMNS = `
	approval_criteria_versions.id,
	approval_criteria_versions.max_regular_deferment_count,
	approval_criteria_versions.deferment_months,
	approval_criteria_versions.deferment_days_reduction,
	approval_criteria_versions.automatic_approval_max_days,
	approval_criteria_versions.denial_days_threshold,
	approval_criteria_versions.automatic_approval_max_payments,
	approval_criteria_versions.max_plan_payments,
	approval_criteria_versions.change_reason,
	approval_criteria_versions.changed_by,
	approval_criteria_versions.changed_at
`;
export const SORT_COLUMNS: Record<SubmissionSortField, string> = {
	createdAt: "approval_reviews.created_at",
	memberNumber: "approval_reviews.member_number",
	status: "approval_reviews.current_status",
	daysPastDue: "approval_reviews.adjusted_days_past_due",
	pastDueBalance: "approval_reviews.adjusted_past_due_balance_cents",
	numberOfPayments: "approval_reviews.number_of_payments",
};
export const MANAGER_REVIEW_PREFIX = `${API_ROUTES.managerReviews}/`;
