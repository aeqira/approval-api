export type UserRole = "associate" | "manager";

export interface AppUser {
	email: string;
	displayName: string | null;
	role: UserRole;
}

interface UserRow {
	email: string;
	display_name: string | null;
	role: UserRole;
}

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
		role: user.role,
	};
}

export function isManager(user: AppUser): boolean {
	return user.role === "manager";
}
