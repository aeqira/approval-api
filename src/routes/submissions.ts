import { jsonNoStore, parsePositiveInteger } from "../functions/helpers";
import { listSubmissions } from "../services/submission-storage";
import type {
	ApprovalStatus,
	SortDirection,
	SubmissionSortField,
} from "../types/approval";

const STATUSES: ApprovalStatus[] = ["approved", "denied", "manager_review"];

const SORT_FIELDS: SubmissionSortField[] = [
	"createdAt",
	"memberNumber",
	"status",
	"daysPastDue",
	"pastDueBalance",
	"numberOfPayments",
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function handleListSubmissions(
	request: Request,
	database: D1Database,
): Promise<Response> {
	const url = new URL(request.url);
	const search = url.searchParams.get("search")?.trim() || undefined;
	const statusValue = url.searchParams.get("status");
	const defermentValue = url.searchParams.get("defermentApplied");
	const dateFrom = url.searchParams.get("dateFrom") || undefined;
	const dateTo = url.searchParams.get("dateTo") || undefined;
	const sortValue = url.searchParams.get("sortBy") ?? "createdAt";
	const directionValue = url.searchParams.get("sortDirection") ?? "desc";
	const page = parsePositiveInteger(url.searchParams.get("page"), 1);
	const pageSize = parsePositiveInteger(url.searchParams.get("pageSize"), 25);

	if (search && search.length > 100) {
		return jsonNoStore({ error: "Search cannot exceed 100 characters" }, 400);
	}

	if (
		statusValue !== null &&
		!STATUSES.includes(statusValue as ApprovalStatus)
	) {
		return jsonNoStore({ error: "Invalid submission status" }, 400);
	}

	if (
		defermentValue !== null &&
		defermentValue !== "true" &&
		defermentValue !== "false"
	) {
		return jsonNoStore({ error: "Invalid deferment filter" }, 400);
	}

	if (dateFrom && !DATE_PATTERN.test(dateFrom)) {
		return jsonNoStore({ error: "Invalid start date" }, 400);
	}

	if (dateTo && !DATE_PATTERN.test(dateTo)) {
		return jsonNoStore({ error: "Invalid end date" }, 400);
	}

	if (!SORT_FIELDS.includes(sortValue as SubmissionSortField)) {
		return jsonNoStore({ error: "Invalid sort field" }, 400);
	}

	if (directionValue !== "asc" && directionValue !== "desc") {
		return jsonNoStore({ error: "Invalid sort direction" }, 400);
	}

	if (page === null || pageSize === null || pageSize > 100) {
		return jsonNoStore({ error: "Invalid pagination values" }, 400);
	}

	try {
		const result = await listSubmissions(database, {
			search,
			status:
				statusValue === null ? undefined : (statusValue as ApprovalStatus),
			defermentApplied:
				defermentValue === null ? undefined : defermentValue === "true",
			dateFrom,
			dateTo,
			sortBy: sortValue as SubmissionSortField,
			sortDirection: directionValue as SortDirection,
			page,
			pageSize,
		});

		return jsonNoStore(result);
	} catch (error) {
		console.error(
			JSON.stringify({
				message: "Failed to load submissions",
				error: error instanceof Error ? error.message : String(error),
			}),
		);

		return jsonNoStore({ error: "Unable to load submissions" }, 500);
	}
}
