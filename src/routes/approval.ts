import { isApprovalRequest } from "../schemas/approval";
import { evaluateApproval } from "../services/approval";
import { jsonNoStore } from "../functions/helpers";
import { saveApprovalReview } from "../services/review-storage";

export async function handleApproval(
	request: Request,
	database: D1Database,
	associateEmail: string,
): Promise<Response> {
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
			associateEmail,
			request: body,
			decision,
		});

		return jsonNoStore({
			...decision,
			reviewId,
		});
	} catch (error) {
		console.error(
			JSON.stringify({
				message: "Failed to save approval review",
				error: error instanceof Error ? error.message : String(error),
			}),
		);
	}

	return jsonNoStore(
		{
			error: "Unable to save approval review",
		},
		500,
	);
}
