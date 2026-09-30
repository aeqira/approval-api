ALTER TABLE approval_reviews
	ADD final_account_comment TEXT;

UPDATE approval_reviews
SET final_account_comment =
	'Payment plan decision: ' ||
	UPPER(REPLACE(current_status, '_', ' ')) ||
	'. Member number: ' ||
	member_number ||
	'. Manager: ' ||
	COALESCE(manager_email, 'Unknown') ||
	'. Manager decision reason: ' ||
	COALESCE(manager_reason, 'No reason provided') ||
	'.'
WHERE reviewed_at IS NOT NULL;