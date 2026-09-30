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
	createdAt: "created_at",
	memberNumber: "member_number",
	status: "current_status",
	daysPastDue: "adjusted_days_past_due",
	pastDueBalance: "adjusted_past_due_balance_cents",
	numberOfPayments: "number_of_payments",
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
				EXISTS (
					SELECT 1
					FROM users
					WHERE users.email = approval_reviews.associate_email COLLATE NOCASE
						AND users.active = 1
						AND users.display_name LIKE ? COLLATE NOCASE
				)
			)`,
		);

		const searchPattern = `%${input.search}%`;
		bindings.push(searchPattern, searchPattern, searchPattern);
	}

	if (input.status) {
		conditions.push("current_status = ?");
		bindings.push(input.status);
	}

	if (input.defermentApplied !== undefined) {
		conditions.push("regular_deferment_applied = ?");
		bindings.push(input.defermentApplied ? 1 : 0);
	}

	if (input.dateFrom) {
		conditions.push("date(created_at) >= date(?)");
		bindings.push(input.dateFrom);
	}

	if (input.dateTo) {
		conditions.push("date(created_at) <= date(?)");
		bindings.push(input.dateTo);
	}

	const whereClause =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

	const countRow = await database
		.prepare(
			`
				SELECT COUNT(*) AS total
				FROM approval_reviews
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
					id,
					member_number,
					associate_email,
					COALESCE(
						(
							SELECT users.display_name
							FROM users
							WHERE users.email = approval_reviews.associate_email COLLATE NOCASE
								AND users.active = 1
							LIMIT 1
						),
						associate_email
					) AS associate_display_name,
					past_due_date,
					days_past_due,
					adjusted_days_past_due,
					past_due_balance_cents,
					adjusted_past_due_balance_cents,
					monthly_payment_cents,
					plan_payment_cents,
					number_of_payments,
					regular_deferment_applied,
					deferment_months,
					deferred_amount_cents,
					initial_status,
					current_status,
					reasons_json,
					COALESCE(final_account_comment, account_comment) AS account_comment,
					manager_email,
					manager_reason,
					reviewed_at,
					created_at
				FROM approval_reviews
				${whereClause}
				ORDER BY ${sortColumn} ${sortDirection}, id ASC
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
