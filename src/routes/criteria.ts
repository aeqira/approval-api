import { jsonNoStore, logWorkerError } from "../functions/helpers";
import { requireAuthenticatedEmail } from "../services/authorization";
import { getActiveApprovalCriteria } from "../services/approval-criteria-storage";

export async function handleGetApprovalCriteria(
	request: Request,
	database: D1Database,
	context: ExecutionContext,
): Promise<Response> {
	const authentication = await requireAuthenticatedEmail(request, context);

	if (!authentication.ok) {
		return authentication.response;
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
