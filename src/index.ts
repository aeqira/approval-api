import { API_ROUTES } from "./config/api";
import { jsonNoStore } from "./functions/helpers";
import { handleApproval } from "./routes/approval";
import { isManagerDecisionRequest } from "./schemas/approval";
import { getAuthenticatedEmail } from "./services/access-identity";
import {
	listPendingManagerReviews,
	resolveManagerReview,
} from "./services/review-storage";
import { findActiveUser, isManager } from "./services/user-storage";
import { handleListSubmissions } from "./routes/submissions";

const MANAGER_REVIEW_PREFIX = `${API_ROUTES.managerReviews}/`;

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "GET" && url.pathname === API_ROUTES.health) {
			return Response.json({
				name: "Approval API",
				status: "running",
			});
		}

		if (request.method === "GET" && url.pathname === API_ROUTES.identity) {
			const associateEmail = await getAuthenticatedEmail(request, ctx);

			if (!associateEmail) {
				return jsonNoStore(
					{
						error: "Authentication required",
					},
					401,
				);
			}

			const storedUser = await findActiveUser(
				env.approval_api_db,
				associateEmail,
			);

			return jsonNoStore({
				email: storedUser?.email ?? associateEmail,
				displayName:
					storedUser?.displayName ?? storedUser?.email ?? associateEmail,
				role: storedUser?.role ?? "associate",
			});
		}

		if (request.method === "GET" && url.pathname === API_ROUTES.submissions) {
			const employeeEmail = await getAuthenticatedEmail(request, ctx);

			if (!employeeEmail) {
				return jsonNoStore(
					{
						error: "Authentication required",
					},
					401,
				);
			}

			return handleListSubmissions(request, env.approval_api_db);
		}

		if (
			request.method === "GET" &&
			url.pathname === API_ROUTES.managerReviews
		) {
			const managerEmail = await getAuthenticatedEmail(request, ctx);

			if (!managerEmail) {
				return jsonNoStore(
					{
						error: "Authentication required",
					},
					401,
				);
			}

			const manager = await findActiveUser(env.approval_api_db, managerEmail);

			if (!manager || !isManager(manager)) {
				return jsonNoStore(
					{
						error: "Manager access required",
					},
					403,
				);
			}

			try {
				const reviews = await listPendingManagerReviews(env.approval_api_db);

				return jsonNoStore({
					reviews,
				});
			} catch (error) {
				console.error(
					JSON.stringify({
						message: "Failed to load manager reviews",
						error: error instanceof Error ? error.message : String(error),
					}),
				);

				return jsonNoStore(
					{
						error: "Unable to load manager reviews",
					},
					500,
				);
			}
		}

		if (
			request.method === "PATCH" &&
			url.pathname.startsWith(MANAGER_REVIEW_PREFIX)
		) {
			const reviewId = url.pathname.slice(MANAGER_REVIEW_PREFIX.length);

			if (!UUID_PATTERN.test(reviewId)) {
				return jsonNoStore(
					{
						error: "Invalid review ID",
					},
					400,
				);
			}

			const managerEmail = await getAuthenticatedEmail(request, ctx);

			if (!managerEmail) {
				return jsonNoStore(
					{
						error: "Authentication required",
					},
					401,
				);
			}

			const manager = await findActiveUser(env.approval_api_db, managerEmail);

			if (!manager || !isManager(manager)) {
				return jsonNoStore(
					{
						error: "Manager access required",
					},
					403,
				);
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
				const decision = await resolveManagerReview(env.approval_api_db, {
					reviewId,
					status: body.status,
					managerEmail: manager.email,
					managerDisplayName: manager.displayName ?? manager.email,
					managerReason: body.reason.trim(),
				});

				if (!decision) {
					return jsonNoStore(
						{
							error: "Pending manager review not found",
						},
						404,
					);
				}

				return jsonNoStore(decision);
			} catch (error) {
				console.error(
					JSON.stringify({
						message: "Failed to resolve manager review",
						reviewId,
						error: error instanceof Error ? error.message : String(error),
					}),
				);

				return jsonNoStore(
					{
						error: "Unable to resolve manager review",
					},
					500,
				);
			}
		}

		if (request.method === "POST" && url.pathname === API_ROUTES.approval) {
			const associateEmail = await getAuthenticatedEmail(request, ctx);

			if (!associateEmail) {
				return jsonNoStore(
					{
						error: "Authentication required",
					},
					401,
				);
			}

			return handleApproval(request, env.approval_api_db, associateEmail);
		}

		if (url.pathname === API_ROUTES.approval) {
			return Response.json(
				{
					error: "Method not allowed",
				},
				{
					status: 405,
					headers: {
						Allow: "POST",
						"Cache-Control": "no-store",
					},
				},
			);
		}

		if (url.pathname === API_ROUTES.submissions) {
			return Response.json(
				{
					error: "Method not allowed",
				},
				{
					status: 405,
					headers: {
						Allow: "GET",
						"Cache-Control": "no-store",
					},
				},
			);
		}

		if (url.pathname === API_ROUTES.managerReviews) {
			return Response.json(
				{
					error: "Method not allowed",
				},
				{
					status: 405,
					headers: {
						Allow: "GET",
						"Cache-Control": "no-store",
					},
				},
			);
		}

		if (url.pathname.startsWith(MANAGER_REVIEW_PREFIX)) {
			return Response.json(
				{
					error: "Method not allowed",
				},
				{
					status: 405,
					headers: {
						Allow: "PATCH",
						"Cache-Control": "no-store",
					},
				},
			);
		}

		return jsonNoStore(
			{
				error: "Not found",
			},
			404,
		);
	},
} satisfies ExportedHandler<Env>;
