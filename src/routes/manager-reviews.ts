import { jsonNoStore, logWorkerError } from "../functions/helpers";
import { isManagerDecisionRequest } from "../schemas/approval";
import { requireManager } from "../services/authorization";
import {
	listPendingManagerReviews,
	resolveManagerReview,
} from "../services/review-storage";

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function handleListManagerReviews(
	request: Request,
	database: D1Database,
	context: ExecutionContext,
): Promise<Response> {
	const authorization = await requireManager(request, database, context);

	if (!authorization.ok) {
		return authorization.response;
	}

	try {
		const reviews = await listPendingManagerReviews(database);
		return jsonNoStore({ reviews });
	} catch (error) {
		logWorkerError("Failed to load manager reviews", error);
		return jsonNoStore({ error: "Unable to load manager reviews" }, 500);
	}
}

export async function handleResolveManagerReview(
	request: Request,
	database: D1Database,
	context: ExecutionContext,
	reviewId: string,
): Promise<Response> {
	if (!UUID_PATTERN.test(reviewId)) {
		return jsonNoStore({ error: "Invalid review ID" }, 400);
	}

	const authorization = await requireManager(request, database, context);

	if (!authorization.ok) {
		return authorization.response;
	}

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonNoStore(
			{ error: "Request body must contain valid JSON" },
			400,
		);
	}

	if (!isManagerDecisionRequest(body)) {
		return jsonNoStore(
			{
				error: "Invalid manager decision request",
				requiredFields: ["status", "reason"],
			},
			400,
		);
	}

	try {
		const manager = authorization.user;
		const decision = await resolveManagerReview(database, {
			reviewId,
			status: body.status,
			managerEmail: manager.email,
			managerDisplayName: manager.displayName ?? manager.email,
			managerReason: body.reason.trim(),
		});

		if (!decision) {
			return jsonNoStore({ error: "Pending manager review not found" }, 404);
		}

		return jsonNoStore(decision);
	} catch (error) {
		logWorkerError("Failed to resolve manager review", error, { reviewId });
		return jsonNoStore({ error: "Unable to resolve manager review" }, 500);
	}
}
