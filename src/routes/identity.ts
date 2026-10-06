import { jsonNoStore } from "../functions/helpers";
import { requireAuthenticatedEmail } from "../services/authorization";
import { findActiveUser } from "../services/user-storage";

export async function handleIdentity(
	request: Request,
	database: D1Database,
	context: ExecutionContext,
): Promise<Response> {
	const authentication = await requireAuthenticatedEmail(request, context);

	if (!authentication.ok) {
		return authentication.response;
	}

	const storedUser = await findActiveUser(database, authentication.email);

	return jsonNoStore({
		email: storedUser?.email ?? authentication.email,
		displayName:
			storedUser?.displayName ?? storedUser?.email ?? authentication.email,
		badgePhoto: storedUser?.badgePhoto ?? null,
		role: storedUser?.role ?? "collector",
	});
}
