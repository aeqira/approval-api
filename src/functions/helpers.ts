import { CURRENCY_FORMATTER, DATE_PATTERN } from "../config/api";
import type {
	ApiErrorResponse,
	ApprovalCriteria,
	ApprovalCriteriaRow,
	ApprovalStatus,
	PaymentChoice,
	UpdateApprovalCriteriaRequest,
} from "../types/approval";

export function formatCurrency(value: number): string {
	return CURRENCY_FORMATTER.format(value);
}

export function getStatusLabel(status: ApprovalStatus): string {
	if (status === "manager_review") {
		return "Review";
	}

	return status === "approved" ? "Approved" : "Denied";
}

export function jsonNoStore(
	body: unknown,
	status: number = 200,
	headers: HeadersInit = {},
): Response {
	return Response.json(body, {
		status,
		headers: {
			...headers,
			"Cache-Control": "no-store",
		},
	});
}

export function methodNotAllowed(allowedMethod: string): Response {
	return jsonNoStore({ error: "Method not allowed" }, 405, {
		Allow: allowedMethod,
	});
}

export function logWorkerError(
	message: string,
	error: unknown,
	context: Record<string, unknown> = {},
): void {
	console.error(
		JSON.stringify({
			message,
			...context,
			error: error instanceof Error ? error.message : String(error),
		}),
	);
}

export function isPositiveNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isNonNegativeInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

export function isValidDate(value: unknown): value is string {
	if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
		return false;
	}

	const parsedDate = new Date(`${value}T00:00:00Z`);

	if (
		Number.isNaN(parsedDate.getTime()) ||
		parsedDate.toISOString().slice(0, 10) !== value
	) {
		return false;
	}

	const now = new Date();
	const today = Date.UTC(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate(),
	);

	return parsedDate.getTime() <= today;
}

export function isPaymentChoice(value: unknown): value is PaymentChoice {
	if (!isRecord(value)) {
		return false;
	}

	if (value.type === "minimum_plus_extra") {
		return isPositiveNumber(value.extraAmount);
	}

	if (value.type === "affordable_payment") {
		return isPositiveNumber(value.affordablePayment);
	}

	return false;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
	return isRecord(value) && typeof value.error === "string";
}

export async function readApiResponse<T>(
	response: Response,
	fallbackMessage: string,
): Promise<T> {
	let body: unknown;

	try {
		body = await response.json();
	} catch {
		throw new Error(fallbackMessage);
	}

	if (!response.ok || isApiErrorResponse(body)) {
		throw new Error(isApiErrorResponse(body) ? body.error : fallbackMessage);
	}

	return body as T;
}

export function getErrorMessage(
	error: unknown,
	fallbackMessage: string,
): string {
	return error instanceof Error ? error.message : fallbackMessage;
}

export async function copyTextToClipboard(value: string): Promise<void> {
	await navigator.clipboard.writeText(value);
}

export function formatSubmittedAt(value: string): string {
	const normalizedValue = value.includes("T")
		? value
		: `${value.replace(" ", "T")}Z`;
	const date = new Date(normalizedValue);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	const submittedTime = date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});

	return `${date.toLocaleDateString("en-US")} ${submittedTime}`;
}

export function splitOriginalComment(comment: string): string[] {
	return comment
		.split(/\.\s+(?=[A-Z])/)
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => (entry.endsWith(".") ? entry : `${entry}.`));
}

export function parsePositiveInteger(
	value: string | null,
	defaultValue: number,
): number | null {
	if (value === null) {
		return defaultValue;
	}

	const parsedValue = Number(value);

	return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function toCents(amount: number): number {
	return Math.round(amount * 100);
}

export function toDollars(cents: number): number {
	return cents / 100;
}

export function calculateDaysPastDue(pastDueDate: string): number {
	const dueDate = new Date(`${pastDueDate}T00:00:00Z`);
	const now = new Date();

	const today = Date.UTC(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate(),
	);

	const difference = today - dueDate.getTime();
	const millisecondsPerDay = 24 * 60 * 60 * 1000;

	return Math.max(0, Math.floor(difference / millisecondsPerDay));
}

export async function waitForMinimumDuration(
	startedAt: number,
	minimumDurationMs: number,
): Promise<void> {
	const remainingDuration = minimumDurationMs - (Date.now() - startedAt);

	if (remainingDuration > 0) {
		await new Promise<void>((resolve) => {
			window.setTimeout(resolve, remainingDuration);
		});
	}
}

export function criteriaToForm(
	criteria: ApprovalCriteria,
): UpdateApprovalCriteriaRequest {
	return {
		maxRegularDefermentCount: criteria.maxRegularDefermentCount,
		defermentMonths: criteria.defermentMonths,
		defermentDaysReduction: criteria.defermentDaysReduction,
		automaticApprovalMaxDays: criteria.automaticApprovalMaxDays,
		denialDaysThreshold: criteria.denialDaysThreshold,
		automaticApprovalMaxPayments: criteria.automaticApprovalMaxPayments,
		maxPlanPayments: criteria.maxPlanPayments,
		changeReason: "",
	};
}

export function getInitials(displayName: string): string {
	const nameParts = displayName.trim().split(/\s+/).filter(Boolean);

	if (nameParts.length === 0) {
		return "?";
	}

	if (nameParts.length === 1) {
		return nameParts[0].slice(0, 2).toUpperCase();
	}

	return `${nameParts[0][0]}${nameParts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function formatCalculatorDigits(value: number): string {
	return Math.round(value * 100)
		.toString()
		.padStart(8, "0")
		.slice(-8);
}

export function isIntegerBetween(
	value: unknown,
	minimum: number,
	maximum: number,
): value is number {
	return isNonNegativeInteger(value) && value >= minimum && value <= maximum;
}

export function mapApprovalCriteria(
	row: ApprovalCriteriaRow,
): ApprovalCriteria {
	return {
		versionId: row.id,
		maxRegularDefermentCount: row.max_regular_deferment_count,
		defermentMonths: row.deferment_months,
		defermentDaysReduction: row.deferment_days_reduction,
		automaticApprovalMaxDays: row.automatic_approval_max_days,
		denialDaysThreshold: row.denial_days_threshold,
		automaticApprovalMaxPayments: row.automatic_approval_max_payments,
		maxPlanPayments: row.max_plan_payments,
		changeReason: row.change_reason,
		changedBy: row.changed_by,
		changedAt: row.changed_at,
	};
}

export function getDateDaysAgo(days: number): string {
	const date = new Date();

	date.setUTCHours(0, 0, 0, 0);
	date.setUTCDate(date.getUTCDate() - days);

	return date.toISOString().slice(0, 10);
}
