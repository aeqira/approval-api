import { isApprovalRequest } from '../schemas/approval';
import { evaluateApproval } from '../services/approval';

export async function handleApproval(request: Request): Promise<Response> {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return Response.json(
			{
				error: 'Request body must be valid JSON.',
			},
			{ status: 400 },
		);
	}

	if (!isApprovalRequest(body)) {
		return Response.json(
			{
				error: 'Invalid approval request.',
				requiredFields: ['pastDueBalance', 'monthlyPayment', 'daysPastDue', 'regularDefermentCount', 'paymentChoice'],
			},
			{ status: 400 },
		);
	}

	const result = evaluateApproval(body);

	return Response.json(result);
}
