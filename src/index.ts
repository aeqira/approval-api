import { handleApproval } from './routes/approval';

export default {
	async fetch(request): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === 'GET' && url.pathname === '/') {
			return Response.json({
				name: 'Approval API',
				status: 'running',
			});
		}

		if (request.method === 'POST' && url.pathname === '/api/approval') {
			return handleApproval(request);
		}

		if (url.pathname === '/api/approval') {
			return Response.json(
				{ error: 'Method not allowed' },
				{
					status: 405,
					headers: {
						Allow: 'POST',
					},
				},
			);
		}

		return Response.json({ error: 'Not found' }, { status: 404 });
	},
} satisfies ExportedHandler<Env>;
