import { isApprovalRequest } from "../schemas/approval";
import { evaluateApproval } from "../services/approval";
import { jsonNoStore, logWorkerError } from "../functions/helpers";
import { requireAuthenticatedEmail } from "../services/authorization";
import { saveApprovalReview } from "../services/review-storage";
import { getActiveApprovalCriteria } from "../services/approval-criteria-storage";

export async function handleApproval(
	request: Request,
	database: D1Database,
	context: ExecutionContext,
): Promise<Response> {
	const authentication = await requireAuthenticatedEmail(request, context);

	if (!authentication.ok) {
		return authentication.response;
	}

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonNoStore(
			{
				error: "Request body must contain valid JSON",
			},
			400,
		);
	}

	if (!isApprovalRequest(body)) {
		return jsonNoStore(
			{
				error: "Invalid approval request",
				requiredFields: [
					"memberNumber",
					"pastDueDate",
					"pastDueBalance",
					"monthlyPayment",
					"regularDefermentCount",
					"paymentChoice",
				],
			},
			400,
		);
	}

	try {
		const criteria = await getActiveApprovalCriteria(database);

		if (!criteria) {
			return jsonNoStore({ error: "Active approval criteria not found" }, 500);
		}

		if (body.regularDefermentCount > criteria.maxRegularDefermentCount) {
			return jsonNoStore(
				{
					error: "Invalid approval request",
					fieldErrors: {
						regularDefermentCount: `Deferments used must be between 0 and ${criteria.maxRegularDefermentCount}.`,
					},
				},
				400,
			);
		}

		const decision = evaluateApproval(body, criteria);
		const reviewId = await saveApprovalReview(database, {
			associateEmail: authentication.email,
			request: body,
			decision,
		});

		return jsonNoStore({
			...decision,
			reviewId,
		});
	} catch (error) {
		logWorkerError("Failed to evaluate or save approval review", error);

		return jsonNoStore({ error: "Unable to process approval review" }, 500);
	}
}
