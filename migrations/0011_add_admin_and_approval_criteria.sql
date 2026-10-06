CREATE TABLE users_new (
	email TEXT COLLATE NOCASE PRIMARY KEY,
	role TEXT NOT NULL
		CHECK (role IN ('collector', 'manager', 'admin')),
	active INTEGER NOT NULL DEFAULT 1
		CHECK (active IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	display_name TEXT
		CHECK (
			display_name IS NULL OR
			length(trim(display_name)) > 0
		),
	badge_photo TEXT
		CHECK (
			badge_photo IS NULL OR
			length(trim(badge_photo)) > 0
		)
);

INSERT INTO users_new (
	email,
	role,
	active,
	created_at,
	updated_at,
	display_name,
	badge_photo
)
SELECT
	email,
	CASE
        WHEN role = 'associate' THEN 'collector'
        ELSE role
    END,
	active,
	created_at,
	updated_at,
	display_name,
	badge_photo
FROM users;

DROP TABLE users;

ALTER TABLE users_new
	RENAME TO users;

CREATE INDEX users_role_active
	ON users (role, active);

CREATE TABLE approval_criteria_versions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	max_regular_deferment_count INTEGER NOT NULL
		CHECK (max_regular_deferment_count >= 0),
	deferment_months INTEGER NOT NULL
		CHECK (deferment_months >= 0),
	deferment_days_reduction INTEGER NOT NULL
		CHECK (deferment_days_reduction >= 0),
	automatic_approval_max_days INTEGER NOT NULL
		CHECK (automatic_approval_max_days >= 0),
	denial_days_threshold INTEGER NOT NULL
		CHECK (
			denial_days_threshold >
			automatic_approval_max_days
		),
	automatic_approval_max_payments INTEGER NOT NULL
		CHECK (automatic_approval_max_payments >= 1),
	max_plan_payments INTEGER NOT NULL
		CHECK (
			max_plan_payments >
			automatic_approval_max_payments
		),
	change_reason TEXT
		CHECK (
			change_reason IS NULL OR
			length(trim(change_reason)) > 0
		),
	changed_by TEXT COLLATE NOCASE,
	changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (changed_by) REFERENCES users (email)
);

CREATE INDEX approval_criteria_versions_changed_at
	ON approval_criteria_versions (changed_at DESC);

CREATE TABLE approval_criteria_settings (
	id INTEGER PRIMARY KEY
		CHECK (id = 1),
	active_version_id INTEGER NOT NULL,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (active_version_id)
		REFERENCES approval_criteria_versions (id)
);

INSERT INTO approval_criteria_versions (
	max_regular_deferment_count,
	deferment_months,
	deferment_days_reduction,
	automatic_approval_max_days,
	denial_days_threshold,
	automatic_approval_max_payments,
	max_plan_payments,
	change_reason,
	changed_by
)
VALUES (
	2,
	3,
	90,
	30,
	90,
	12,
	18,
	'Initial approval criteria migrated from application defaults.',
	NULL
);

INSERT INTO approval_criteria_settings (
	id,
	active_version_id
)
VALUES (
	1,
	last_insert_rowid()
);