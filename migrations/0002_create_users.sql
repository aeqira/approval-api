CREATE TABLE users (
	email TEXT COLLATE NOCASE PRIMARY KEY,
	role TEXT NOT NULL
		CHECK (role IN ('associate', 'manager')),
	active INTEGER NOT NULL DEFAULT 1
		CHECK (active IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX users_role_active
	ON users (role, active);