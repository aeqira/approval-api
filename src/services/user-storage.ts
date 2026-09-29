export type UserRole = "associate" | "manager";

export interface AppUser {
	email: string;
	role: UserRole;
}

interface UserRow extends AppUser {}

export async function findActiveUser(
	database: D1Database,
	email: string,
): Promise<AppUser | null> {
	const user = await database
		.prepare(
			`
                SELECT
                    email,
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
		role: user.role,
	};
}

export function isManager(user: AppUser): boolean {
	return user.role === "manager";
}
