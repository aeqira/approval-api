import { isApprovalRequest } from "../schemas/approval";
import { evaluateApproval } from "../services/approval";
import { jsonNoStore, logWorkerError } from "../functions/helpers";
import { requireAuthenticatedEmail } from "../services/authorization";
import { saveApprovalReview } from "../services/review-storage";

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

	const decision = evaluateApproval(body);

	try {
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
		logWorkerError("Failed to save approval review", error);
	}

	return jsonNoStore(
		{
			error: "Unable to save approval review",
		},
		500,
	);
}
