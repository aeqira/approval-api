import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { API_ROUTES } from "../src/config/api";
import type { ApprovalResponse } from "../src/types/approval";

function getDateDaysAgo(days: number): string {
	const date = new Date();

	date.setUTCHours(0, 0, 0, 0);
	date.setUTCDate(date.getUTCDate() - days);

	return date.toISOString().slice(0, 10);
}

async function getDecision(
	daysPastDue: number,
	pastDueBalance: number,
): Promise<ApprovalResponse> {
	const response = await SELF.fetch(
		new URL(API_ROUTES.approval, "https://example.com").toString(),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"CF-Access-Authenticated-User-Email": "associate@aeqira.com",
			},
			body: JSON.stringify({
				memberNumber: "123456",
				pastDueDate: getDateDaysAgo(daysPastDue),
				pastDueBalance,
				monthlyPayment: 300,
				regularDefermentCount: 0,
				paymentChoice: {
					type: "minimum_plus_extra",
					extraAmount: 100,
				},
			}),
		},
	);

	return (await response.json()) as ApprovalResponse;
}

describe("days-past-due boundaries", () => {
	it.each([
		[30, "approved"],
		[31, "manager_review"],
		[89, "manager_review"],
		[90, "denied"],
	])("returns %s days past due as %s", async (daysPastDue, expectedStatus) => {
		const result = await getDecision(daysPastDue, 600);

		expect(result.status).toBe(expectedStatus);
	});
});

describe("payment-count boundaries", () => {
	it.each([
		[1200, 12, "approved"],
		[1300, 13, "manager_review"],
		[1800, 18, "manager_review"],
		[1900, 19, "denied"],
	])(
		"evaluates a $%s balance as %s payments with status %s",
		async (pastDueBalance, expectedPayments, expectedStatus) => {
			const result = await getDecision(20, pastDueBalance);

			expect(result.numberOfPayments).toBe(expectedPayments);
			expect(result.status).toBe(expectedStatus);
		},
	);
});
