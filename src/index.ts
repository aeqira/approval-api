import { API_ROUTES } from "./config/api";
import { jsonNoStore, methodNotAllowed } from "./functions/helpers";
import { handleApproval } from "./routes/approval";
import { handleIdentity } from "./routes/identity";
import {
	handleListManagerReviews,
	handleResolveManagerReview,
} from "./routes/manager-reviews";
import { handleListSubmissions } from "./routes/submissions";

const MANAGER_REVIEW_PREFIX = `${API_ROUTES.managerReviews}/`;

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

		if (url.pathname === API_ROUTES.approval) {
			return request.method === "POST"
				? handleApproval(request, env.approval_api_db, ctx)
				: methodNotAllowed("POST");
		}

		return jsonNoStore({ error: "Not found" }, 404);
	},
} satisfies ExportedHandler<Env>;
