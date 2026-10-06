INSERT INTO users (
	email,
	display_name,
	role,
	active
)
VALUES (
	'arichard@aeqira.com',
	'Andrew Richard',
	'admin',
	1
)
ON CONFLICT(email) DO UPDATE SET
	display_name = COALESCE(
		users.display_name,
		excluded.display_name
	),
	role = 'admin',
	active = 1,
	updated_at = CURRENT_TIMESTAMP;