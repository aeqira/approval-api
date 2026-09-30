UPDATE approval_reviews
SET final_account_comment = replace(
	final_account_comment,
	'Manager: ' || manager_email || '.',
	'Manager: ' || (
		SELECT users.display_name
		FROM users
		WHERE users.email = approval_reviews.manager_email COLLATE NOCASE
			AND users.active = 1
			AND users.display_name IS NOT NULL
		LIMIT 1
	) || '.'
)
WHERE final_account_comment IS NOT NULL
	AND manager_email IS NOT NULL
	AND EXISTS (
		SELECT 1
		FROM users
		WHERE users.email = approval_reviews.manager_email COLLATE NOCASE
			AND users.active = 1
			AND users.display_name IS NOT NULL
	);

UPDATE approval_reviews
SET final_account_comment = replace(final_account_comment, '..', '.')
WHERE final_account_comment LIKE '%..%';
