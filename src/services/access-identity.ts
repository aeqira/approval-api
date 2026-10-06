import { ACCESS_EMAIL_HEADER } from "../config/api";

export async function getAuthenticatedEmail(
	request: Request,
	context: ExecutionContext,
): Promise<string | null> {
	const identity = await context.access?.getIdentity();

	const email = identity?.email ?? request.headers.get(ACCESS_EMAIL_HEADER);

	if (typeof email !== "string") {
		return null;
	}

	const normalizedEmail = email.trim().toLowerCase();

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
		return null;
	}

	return normalizedEmail;
}
