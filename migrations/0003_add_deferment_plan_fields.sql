ALTER TABLE approval_reviews
	ADD adjusted_days_past_due INTEGER NOT NULL DEFAULT 0
	CHECK (adjusted_days_past_due >= 0);

ALTER TABLE approval_reviews
	ADD adjusted_past_due_balance_cents INTEGER NOT NULL DEFAULT 0
	CHECK (adjusted_past_due_balance_cents >= 0);

ALTER TABLE approval_reviews
	ADD regular_deferment_applied INTEGER NOT NULL DEFAULT 0
	CHECK (regular_deferment_applied IN (0, 1));

ALTER TABLE approval_reviews
	ADD deferment_months INTEGER NOT NULL DEFAULT 0
	CHECK (deferment_months IN (0, 3));

ALTER TABLE approval_reviews
	ADD deferred_amount_cents INTEGER NOT NULL DEFAULT 0
	CHECK (deferred_amount_cents >= 0);