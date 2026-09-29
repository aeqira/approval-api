import { isApprovalRequest } from '../schemas/approval';
import type { ApprovalResponse } from '../types/approval';

export async function handleApproval(request: Request): Promise<Response> {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 });
	}

	if (!isApprovalRequest(body)) {
		return Response.json({ error: 'inputs must be a non-empty array of strings' }, { status: 400 });
	}

	const response: ApprovalResponse = {
		outputs: body.inputs.map((input) => input.trim().toUpperCase()),
	};

	return Response.json(response);
}
