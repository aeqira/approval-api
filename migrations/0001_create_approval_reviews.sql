CREATE TABLE approval_reviews (
	id TEXT PRIMARY KEY,
	member_number TEXT NOT NULL,
	associate_email TEXT NOT NULL,

	past_due_date TEXT NOT NULL,
	days_past_due INTEGER NOT NULL CHECK (days_past_due >= 0),
	past_due_balance_cents INTEGER NOT NULL CHECK (past_due_balance_cents > 0),
	monthly_payment_cents INTEGER NOT NULL CHECK (monthly_payment_cents > 0),
	regular_deferment_count INTEGER NOT NULL CHECK (regular_deferment_count >= 0),

	payment_choice_type TEXT NOT NULL
		CHECK (payment_choice_type IN ('minimum_plus_extra', 'affordable_payment')),
	payment_choice_amount_cents INTEGER NOT NULL
		CHECK (payment_choice_amount_cents > 0),

	initial_status TEXT NOT NULL
		CHECK (initial_status IN ('approved', 'denied', 'manager_review')),
	current_status TEXT NOT NULL
		CHECK (current_status IN ('approved', 'denied', 'manager_review')),

	plan_payment_cents INTEGER NOT NULL CHECK (plan_payment_cents >= 0),
	catch_up_amount_cents INTEGER NOT NULL CHECK (catch_up_amount_cents >= 0),
	number_of_payments INTEGER NOT NULL CHECK (number_of_payments >= 0),
	final_payment_cents INTEGER NOT NULL CHECK (final_payment_cents >= 0),
	regular_deferment_available INTEGER NOT NULL
		CHECK (regular_deferment_available IN (0, 1)),

	reasons_json TEXT NOT NULL,
	account_comment TEXT NOT NULL,

	manager_email TEXT,
	manager_reason TEXT,
	reviewed_at TEXT,

	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX approval_reviews_status_created_at
	ON approval_reviews (current_status, created_at DESC);

CREATE INDEX approval_reviews_member_number
	ON approval_reviews (member_number);