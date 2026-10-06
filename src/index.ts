import { API_ROUTES, MANAGER_REVIEW_PREFIX } from "./config/api";
import { jsonNoStore, methodNotAllowed } from "./functions/helpers";
import { handleApproval } from "./routes/approval";
import { handleIdentity } from "./routes/identity";
import {
	handleListManagerReviews,
	handleResolveManagerReview,
} from "./routes/manager-reviews";
import { handleListSubmissions } from "./routes/submissions";
import {
	handleGetApprovalCriteria,
	handleListApprovalCriteriaHistory,
	handleUpdateApprovalCriteria,
} from "./routes/admin-criteria";
import { handleGetApprovalCriteria as handleGetActiveApprovalCriteria } from "./routes/criteria";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === API_ROUTES.health) {
			return request.method === "GET"
				? jsonNoStore({ name: "Approval API", status: "running" })
				: methodNotAllowed("GET");
		}

		if (url.pathname === API_ROUTES.identity) {
			return request.method === "GET"
				? handleIdentity(request, env.approval_api_db, ctx)
				: methodNotAllowed("GET");
		}

		if (url.pathname === API_ROUTES.criteria) {
			return request.method === "GET"
				? handleGetActiveApprovalCriteria(request, env.approval_api_db, ctx)
				: methodNotAllowed("GET");
		}

		if (url.pathname === API_ROUTES.submissions) {
			return request.method === "GET"
				? handleListSubmissions(request, env.approval_api_db, ctx)
				: methodNotAllowed("GET");
		}

		if (url.pathname === API_ROUTES.managerReviews) {
			return request.method === "GET"
				? handleListManagerReviews(request, env.approval_api_db, ctx)
				: methodNotAllowed("GET");
		}

		if (url.pathname.startsWith(MANAGER_REVIEW_PREFIX)) {
			const reviewId = url.pathname.slice(MANAGER_REVIEW_PREFIX.length);

			return request.method === "PATCH"
				? handleResolveManagerReview(
						request,
						env.approval_api_db,
						ctx,
						reviewId,
					)
				: methodNotAllowed("PATCH");
		}

		if (url.pathname === API_ROUTES.adminCriteria) {
			if (request.method === "GET") {
				return handleGetApprovalCriteria(request, env.approval_api_db, ctx);
			}

			if (request.method === "PATCH") {
				return handleUpdateApprovalCriteria(request, env.approval_api_db, ctx);
			}

			return methodNotAllowed("GET, PATCH");
		}

		if (url.pathname === API_ROUTES.adminCriteriaHistory) {
			return request.method === "GET"
				? handleListApprovalCriteriaHistory(request, env.approval_api_db, ctx)
				: methodNotAllowed("GET");
		}

		if (url.pathname === API_ROUTES.approval) {
			return request.method === "POST"
				? handleApproval(request, env.approval_api_db, ctx)
				: methodNotAllowed("POST");
		}

		return jsonNoStore({ error: "Not found" }, 404);
	},
} satisfies ExportedHandler<Env>;
