ALTER TABLE users
	ADD display_name TEXT
	CHECK (
		display_name IS NULL OR
		length(trim(display_name)) > 0
	);

UPDATE users
SET
	display_name = 'Andrew Richard',
	updated_at = CURRENT_TIMESTAMP
WHERE email IN (
	'arichard@aeqira.com',
	'a.richard5@icloud.com'
);