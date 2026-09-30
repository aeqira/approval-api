import { toCents, toDollars } from "../functions/helpers";
import type {
	ApprovalDecision,
	ApprovalRequest,
	ManagerDecisionResponse,
	ManagerDecisionStatus,
	ManagerReview,
} from "../types/approval";

interface SaveApprovalReviewInput {
	associateEmail: string;
	request: ApprovalRequest;
	decision: ApprovalDecision;
}

interface ManagerReviewRow {
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

interface ResolveManagerReviewInput {
	reviewId: string;
	status: ManagerDecisionStatus;
	managerEmail: string;
	managerDisplayName: string;
	managerReason: string;
}

export async function saveApprovalReview(
	database: D1Database,
	input: SaveApprovalReviewInput,
): Promise<string> {
	const id = crypto.randomUUID();

	const paymentChoiceAmount =
		input.request.paymentChoice.type === "minimum_plus_extra"
			? input.request.paymentChoice.extraAmount
			: input.request.paymentChoice.affordablePayment;

	await database
		.prepare(
			`
				INSERT INTO approval_reviews (
					id,
					member_number,
					associate_email,
					past_due_date,
					days_past_due,
					adjusted_days_past_due,
					past_due_balance_cents,
					adjusted_past_due_balance_cents,
					monthly_payment_cents,
					regular_deferment_count,
					payment_choice_type,
					payment_choice_amount_cents,
					initial_status,
					current_status,
					plan_payment_cents,
					catch_up_amount_cents,
					number_of_payments,
					final_payment_cents,
					regular_deferment_available,
					regular_deferment_applied,
					deferment_months,
					deferred_amount_cents,
					reasons_json,
					account_comment
				)
				VALUES (
					?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
					?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
				)
			`,
		)
		.bind(
			id,
			input.request.memberNumber,
			input.associateEmail,
			input.request.pastDueDate,
			input.decision.daysPastDue,
			input.decision.adjustedDaysPastDue,
			toCents(input.request.pastDueBalance),
			toCents(input.decision.adjustedPastDueBalance),
			toCents(input.request.monthlyPayment),
			input.request.regularDefermentCount,
			input.request.paymentChoice.type,
			toCents(paymentChoiceAmount),
			input.decision.status,
			input.decision.status,
			toCents(input.decision.planPayment),
			toCents(input.decision.catchUpAmount),
			input.decision.numberOfPayments,
			toCents(input.decision.finalPayment),
			input.decision.regularDefermentAvailable ? 1 : 0,
			input.decision.regularDefermentApplied ? 1 : 0,
			input.decision.defermentMonths,
			toCents(input.decision.deferredAmount),
			JSON.stringify(input.decision.reasons),
			input.decision.accountComment,
		)
		.run();

	return id;
}

export async function listPendingManagerReviews(
	database: D1Database,
): Promise<ManagerReview[]> {
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
					regular_deferment_available,
					regular_deferment_applied,
					deferment_months,
					deferred_amount_cents,
					reasons_json,
					created_at
				FROM approval_reviews
				WHERE current_status = 'manager_review'
				ORDER BY created_at ASC
				LIMIT 100
			`,
		)
		.all<ManagerReviewRow>();

	return result.results.map((row) => ({
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
		regularDefermentAvailable: row.regular_deferment_available === 1,
		regularDefermentApplied: row.regular_deferment_applied === 1,
		defermentMonths: row.deferment_months,
		deferredAmount: toDollars(row.deferred_amount_cents),
		reasons: JSON.parse(row.reasons_json) as string[],
		createdAt: row.created_at,
	}));
}

export async function resolveManagerReview(
	database: D1Database,
	input: ResolveManagerReviewInput,
): Promise<ManagerDecisionResponse | null> {
	const pendingReview = await database
		.prepare(
			`
				SELECT account_comment
				FROM approval_reviews
				WHERE id = ?
					AND current_status = 'manager_review'
			`,
		)
		.bind(input.reviewId)
		.first<{ account_comment: string }>();

	if (!pendingReview) {
		return null;
	}

	const reviewedAt = new Date().toISOString();
	const statusLabel = input.status.toUpperCase();
	const managerReasonForComment = input.managerReason.replace(/\.+$/, "");

	const managerComment = [
		`Manager decision: ${statusLabel}.`,
		`Manager: ${input.managerDisplayName}.`,
		`Manager decision reason: ${managerReasonForComment}.`,
	].join(" ");

	const accountComment = [
		pendingReview.account_comment.trim(),
		managerComment,
	].join("\n\n");

	const result = await database
		.prepare(
			`
				UPDATE approval_reviews
				SET
					current_status = ?,
					manager_email = ?,
					manager_reason = ?,
					final_account_comment = ?,
					reviewed_at = ?,
					updated_at = ?
				WHERE id = ?
					AND current_status = 'manager_review'
			`,
		)
		.bind(
			input.status,
			input.managerEmail,
			input.managerReason,
			accountComment,
			reviewedAt,
			reviewedAt,
			input.reviewId,
		)
		.run();

	if (result.meta.changes === 0) {
		return null;
	}

	return {
		reviewId: input.reviewId,
		status: input.status,
		managerEmail: input.managerEmail,
		managerDisplayName: input.managerDisplayName,
		managerReason: input.managerReason,
		accountComment,
		reviewedAt,
	};
}
