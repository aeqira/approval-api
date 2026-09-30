ALTER TABLE users
	ADD badge_photo TEXT
	CHECK (
		badge_photo IS NULL OR
		length(trim(badge_photo)) > 0
	);
