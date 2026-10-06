import { jsonNoStore, logWorkerError } from "../functions/helpers";
import { isUpdateApprovalCriteriaRequest } from "../schemas/approval-criteria";
import { requireAdmin } from "../services/authorization";
import {
	getActiveApprovalCriteria,
	listApprovalCriteriaVersions,
	saveApprovalCriteria,
} from "../services/approval-criteria-storage";

export async function handleGetApprovalCriteria(
	request: Request,
	database: D1Database,
	context: ExecutionContext,
): Promise<Response> {
	const authorization = await requireAdmin(request, database, context);

	if (!authorization.ok) {
		return authorization.response;
	}

	try {
		const criteria = await getActiveApprovalCriteria(database);

		if (!criteria) {
			return jsonNoStore({ error: "Active approval criteria not found" }, 404);
		}

		return jsonNoStore({ criteria });
	} catch (error) {
		logWorkerError("Failed to load approval criteria", error);
		return jsonNoStore({ error: "Unable to load approval criteria" }, 500);
	}
}

export async function handleListApprovalCriteriaHistory(
	request: Request,
	database: D1Database,
	context: ExecutionContext,
): Promise<Response> {
	const authorization = await requireAdmin(request, database, context);

	if (!authorization.ok) {
		return authorization.response;
	}

	try {
		const versions = await listApprovalCriteriaVersions(database);
		return jsonNoStore({ versions });
	} catch (error) {
		logWorkerError("Failed to load approval criteria history", error);
		return jsonNoStore(
			{ error: "Unable to load approval criteria history" },
			500,
		);
	}
}

export async function handleUpdateApprovalCriteria(
	request: Request,
	database: D1Database,
	context: ExecutionContext,
): Promise<Response> {
	const authorization = await requireAdmin(request, database, context);

	if (!authorization.ok) {
		return authorization.response;
	}

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonNoStore({ error: "Request body must contain valid JSON" }, 400);
	}

	if (!isUpdateApprovalCriteriaRequest(body)) {
		return jsonNoStore(
			{
				error: "Invalid approval criteria",
				requiredFields: [
					"maxRegularDefermentCount",
					"defermentMonths",
					"defermentDaysReduction",
					"automaticApprovalMaxDays",
					"denialDaysThreshold",
					"automaticApprovalMaxPayments",
					"maxPlanPayments",
					"changeReason",
				],
			},
			400,
		);
	}

	try {
		const criteria = await saveApprovalCriteria(database, {
			...body,
			changeReason: body.changeReason.trim(),
			changedBy: authorization.user.email,
		});

		return jsonNoStore({ criteria });
	} catch (error) {
		logWorkerError("Failed to update approval criteria", error, {
			adminEmail: authorization.user.email,
		});

		return jsonNoStore({ error: "Unable to update approval criteria" }, 500);
	}
}
