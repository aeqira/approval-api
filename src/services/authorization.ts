import { jsonNoStore } from "../functions/helpers";
import type {
	AdminAuthorizationResult,
	AuthenticationResult,
	ManagerAuthorizationResult,
} from "../types/approval";
import { getAuthenticatedEmail } from "./access-identity";
import { findActiveUser, isAdmin, isManager } from "./user-storage";

export async function requireAuthenticatedEmail(
	request: Request,
	context: ExecutionContext,
): Promise<AuthenticationResult> {
	const email = await getAuthenticatedEmail(request, context);

	if (!email) {
		return {
			ok: false,
			response: jsonNoStore({ error: "Authentication required" }, 401),
		};
	}

	return { ok: true, email };
}

export async function requireManager(
	request: Request,
	database: D1Database,
	context: ExecutionContext,
): Promise<ManagerAuthorizationResult> {
	const authentication = await requireAuthenticatedEmail(request, context);

	if (!authentication.ok) {
		return authentication;
	}

	const user = await findActiveUser(database, authentication.email);

	if (!user || !isManager(user)) {
		return {
			ok: false,
			response: jsonNoStore({ error: "Manager access required" }, 403),
		};
	}

	return { ok: true, user };
}

export async function requireAdmin(
	request: Request,
	database: D1Database,
	context: ExecutionContext,
): Promise<AdminAuthorizationResult> {
	const authentication = await requireAuthenticatedEmail(request, context);

	if (!authentication.ok) {
		return authentication;
	}

	const user = await findActiveUser(database, authentication.email);

	if (!user || !isAdmin(user)) {
		return {
			ok: false,
			response: jsonNoStore({ error: "Admin access required" }, 403),
		};
	}

	return { ok: true, user };
}
