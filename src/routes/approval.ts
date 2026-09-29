import { isApprovalRequest } from '../schemas/approval';
import { evaluateApproval } from '../services/approval';

function jsonNoStore(body: unknown, status: number = 200): Response {
	return Response.json(body, {
		status,
		headers: {
			'Cache-Control': 'no-store',
		},
	});
}

export async function handleApproval(request: Request): Promise<Response> {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonNoStore(
			{
				error: 'Request body must be valid JSON',
			},
			400,
		);
	}

	if (!isApprovalRequest(body)) {
		return jsonNoStore(
			{
				error: 'Invalid approval request',
				requiredFields: ['pastDueBalance', 'monthlyPayment', 'daysPastDue', 'regularDefermentCount', 'paymentChoice'],
			},
			400,
		);
	}

	return jsonNoStore(evaluateApproval(body));
}
