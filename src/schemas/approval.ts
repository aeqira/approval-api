import type { ApprovalRequest } from '../types/approval';

export function isApprovalRequest(value: unknown): value is ApprovalRequest {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const request = value as Record<string, unknown>;

	return (
		Array.isArray(request.inputs) &&
		request.inputs.length > 0 &&
		request.inputs.every((input) => typeof input === 'string' && input.trim().length > 0)
	);
}
