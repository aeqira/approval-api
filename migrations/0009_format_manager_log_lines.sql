UPDATE approval_reviews
SET final_account_comment =
	trim(account_comment) ||
	char(10) || char(10) ||
	'Manager decision: ' ||
	UPPER(REPLACE(current_status, '_', ' ')) ||
	'.' || char(10) ||
	'Manager: ' ||
	COALESCE(
		(
			SELECT users.display_name
			FROM users
			WHERE users.email = approval_reviews.manager_email COLLATE NOCASE
				AND users.active = 1
				AND users.display_name IS NOT NULL
			LIMIT 1
		),
		manager_email,
		'Unknown'
	) ||
	'.' || char(10) ||
	'Manager decision reason: ' ||
	rtrim(COALESCE(manager_reason, 'No reason provided'), '.') ||
	'.'
WHERE reviewed_at IS NOT NULL;
