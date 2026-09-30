import { toDollars } from "../functions/helpers";
import type {
	ApprovalSubmission,
	ApprovalSubmissionsResponse,
	ListSubmissionsInput,
	SubmissionCountRow,
	SubmissionRow,
	SubmissionSortField,
} from "../types/approval";

const SORT_COLUMNS: Record<SubmissionSortField, string> = {
	createdAt: "approval_reviews.created_at",
	memberNumber: "approval_reviews.member_number",
	status: "approval_reviews.current_status",
	daysPastDue: "approval_reviews.adjusted_days_past_due",
	pastDueBalance: "approval_reviews.adjusted_past_due_balance_cents",
	numberOfPayments: "approval_reviews.number_of_payments",
};

export async function listSubmissions(
	database: D1Database,
	input: ListSubmissionsInput,
): Promise<ApprovalSubmissionsResponse> {
	const conditions: string[] = [];
	const bindings: Array<string | number> = [];

	if (input.search) {
		conditions.push(
			`(
				approval_reviews.member_number LIKE ? COLLATE NOCASE OR
				approval_reviews.associate_email LIKE ? COLLATE NOCASE OR
				associate_user.display_name LIKE ? COLLATE NOCASE
			)`,
		);

		const searchPattern = `%${input.search}%`;
		bindings.push(searchPattern, searchPattern, searchPattern);
	}

	if (input.status) {
		conditions.push("approval_reviews.current_status = ?");
		bindings.push(input.status);
	}

	if (input.defermentApplied !== undefined) {
		conditions.push("approval_reviews.regular_deferment_applied = ?");
		bindings.push(input.defermentApplied ? 1 : 0);
	}

	if (input.dateFrom) {
		conditions.push("date(approval_reviews.created_at) >= date(?)");
		bindings.push(input.dateFrom);
	}

	if (input.dateTo) {
		conditions.push("date(approval_reviews.created_at) <= date(?)");
		bindings.push(input.dateTo);
	}

	const whereClause =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

	const countRow = await database
		.prepare(
			`
				SELECT COUNT(*) AS total
				FROM approval_reviews
				LEFT JOIN users AS associate_user
					ON associate_user.email = approval_reviews.associate_email COLLATE NOCASE
					AND associate_user.active = 1
				${whereClause}
			`,
		)
		.bind(...bindings)
		.first<SubmissionCountRow>();

	const total = countRow?.total ?? 0;
	const offset = (input.page - 1) * input.pageSize;
	const sortColumn = SORT_COLUMNS[input.sortBy];
	const sortDirection = input.sortDirection === "asc" ? "ASC" : "DESC";

	const result = await database
		.prepare(
			`
				SELECT
					approval_reviews.id,
					approval_reviews.member_number,
					approval_reviews.associate_email,
					COALESCE(
						associate_user.display_name,
						approval_reviews.associate_email
					) AS associate_display_name,
					associate_user.badge_photo AS associate_badge_photo,
					approval_reviews.past_due_date,
					approval_reviews.days_past_due,
					approval_reviews.adjusted_days_past_due,
					approval_reviews.past_due_balance_cents,
					approval_reviews.adjusted_past_due_balance_cents,
					approval_reviews.monthly_payment_cents,
					approval_reviews.plan_payment_cents,
					approval_reviews.number_of_payments,
					approval_reviews.regular_deferment_applied,
					approval_reviews.deferment_months,
					approval_reviews.deferred_amount_cents,
					approval_reviews.initial_status,
					approval_reviews.current_status,
					approval_reviews.reasons_json,
					COALESCE(
						approval_reviews.final_account_comment,
						approval_reviews.account_comment
					) AS account_comment,
					approval_reviews.manager_email,
					approval_reviews.manager_reason,
					approval_reviews.reviewed_at,
					approval_reviews.created_at
				FROM approval_reviews
				LEFT JOIN users AS associate_user
					ON associate_user.email = approval_reviews.associate_email COLLATE NOCASE
					AND associate_user.active = 1
				${whereClause}
				ORDER BY ${sortColumn} ${sortDirection}, approval_reviews.id ASC
				LIMIT ? OFFSET ?
			`,
		)
		.bind(...bindings, input.pageSize, offset)
		.all<SubmissionRow>();

	const submissions: ApprovalSubmission[] = result.results.map((row) => ({
		reviewId: row.id,
		memberNumber: row.member_number,
		associateEmail: row.associate_email,
		associateDisplayName: row.associate_display_name,
		associateBadgePhoto: row.associate_badge_photo,
		pastDueDate: row.past_due_date,
		daysPastDue: row.days_past_due,
		adjustedDaysPastDue: row.adjusted_days_past_due,
		pastDueBalance: toDollars(row.past_due_balance_cents),
		adjustedPastDueBalance: toDollars(row.adjusted_past_due_balance_cents),
		monthlyPayment: toDollars(row.monthly_payment_cents),
		planPayment: toDollars(row.plan_payment_cents),
		numberOfPayments: row.number_of_payments,
		regularDefermentApplied: row.regular_deferment_applied === 1,
		defermentMonths: row.deferment_months,
		deferredAmount: toDollars(row.deferred_amount_cents),
		initialStatus: row.initial_status,
		currentStatus: row.current_status,
		reasons: JSON.parse(row.reasons_json) as string[],
		accountComment: row.account_comment,
		managerEmail: row.manager_email,
		managerReason: row.manager_reason,
		reviewedAt: row.reviewed_at,
		createdAt: row.created_at,
	}));

	return {
		submissions,
		total,
		page: input.page,
		pageSize: input.pageSize,
		totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
	};
}
