import { CRITERIA_COLUMNS } from "../config/api";
import { mapApprovalCriteria } from "../functions/helpers";
import type {
	ApprovalCriteria,
	ApprovalCriteriaRow,
	SaveApprovalCriteriaInput,
} from "../types/approval";

export async function getActiveApprovalCriteria(
	database: D1Database,
): Promise<ApprovalCriteria | null> {
	const row = await database
		.prepare(
			`
				SELECT ${CRITERIA_COLUMNS}
				FROM approval_criteria_settings
				INNER JOIN approval_criteria_versions
					ON approval_criteria_versions.id =
						approval_criteria_settings.active_version_id
				WHERE approval_criteria_settings.id = 1
				LIMIT 1
			`,
		)
		.first<ApprovalCriteriaRow>();

	return row ? mapApprovalCriteria(row) : null;
}

export async function listApprovalCriteriaVersions(
	database: D1Database,
): Promise<ApprovalCriteria[]> {
	const result = await database
		.prepare(
			`
				SELECT ${CRITERIA_COLUMNS}
				FROM approval_criteria_versions
				ORDER BY approval_criteria_versions.id DESC
				LIMIT 50
			`,
		)
		.all<ApprovalCriteriaRow>();

	return result.results.map(mapApprovalCriteria);
}

export async function saveApprovalCriteria(
	database: D1Database,
	input: SaveApprovalCriteriaInput,
): Promise<ApprovalCriteria> {
	await database.batch([
		database
			.prepare(
				`
					INSERT INTO approval_criteria_versions (
						max_regular_deferment_count,
						deferment_months,
						deferment_days_reduction,
						automatic_approval_max_days,
						denial_days_threshold,
						automatic_approval_max_payments,
						max_plan_payments,
						change_reason,
						changed_by
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
				`,
			)
			.bind(
				input.maxRegularDefermentCount,
				input.defermentMonths,
				input.defermentDaysReduction,
				input.automaticApprovalMaxDays,
				input.denialDaysThreshold,
				input.automaticApprovalMaxPayments,
				input.maxPlanPayments,
				input.changeReason.trim(),
				input.changedBy,
			),
		database.prepare(
			`
				UPDATE approval_criteria_settings
				SET
					active_version_id = last_insert_rowid(),
					updated_at = CURRENT_TIMESTAMP
				WHERE id = 1
			`,
		),
	]);

	const criteria = await getActiveApprovalCriteria(database);

	if (!criteria) {
		throw new Error("Active approval criteria could not be loaded");
	}

	return criteria;
}
