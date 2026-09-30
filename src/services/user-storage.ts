import type { AppUser, UserRow } from "../types/approval";

export async function findActiveUser(
	database: D1Database,
	email: string,
): Promise<AppUser | null> {
	const user = await database
		.prepare(
			`
				SELECT
					email,
					display_name,
					badge_photo,
					role
				FROM users
				WHERE email = ? COLLATE NOCASE
					AND active = 1
				LIMIT 1
			`,
		)
		.bind(email)
		.first<UserRow>();

	if (!user) {
		return null;
	}

	return {
		email: user.email.trim().toLowerCase(),
		displayName: user.display_name?.trim() || null,
		badgePhoto: user.badge_photo?.trim() || null,
		role: user.role,
	};
}

export function isManager(user: AppUser): boolean {
	return user.role === "manager";
}
