import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { API_ROUTES } from "../src/config/api";
import type { ApprovalResponse } from "../src/types/approval";
import { getDateDaysAgo } from "../src/functions/helpers";

async function getDecision(
	daysPastDue: number,
	pastDueBalance: number,
	regularDefermentCount = 2,
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
				regularDefermentCount,
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

describe("three-month regular deferment", () => {
	it("auto-approves a deferment-only result when it clears the delinquency", async () => {
		const result = await getDecision(45, 600, 0);

		expect(result).toMatchObject({
			status: "approved",
			daysPastDue: 45,
			adjustedDaysPastDue: 0,
			adjustedPastDueBalance: 0,
			planPayment: 300,
			catchUpAmount: 0,
			numberOfPayments: 0,
			finalPayment: 300,
			regularDefermentAvailable: true,
			regularDefermentApplied: true,
			defermentMonths: 3,
			deferredAmount: 600,
		});

		expect(result.reasons).toContain(
			"Approved for 3-month deferment only; no payment plan is required.",
		);
	});

	it("calculates a payment plan from the balance remaining after deferment", async () => {
		const result = await getDecision(120, 1200, 1);

		expect(result).toMatchObject({
			status: "approved",
			daysPastDue: 120,
			adjustedDaysPastDue: 30,
			adjustedPastDueBalance: 300,
			planPayment: 400,
			catchUpAmount: 100,
			numberOfPayments: 3,
			finalPayment: 400,
			regularDefermentAvailable: true,
			regularDefermentApplied: true,
			defermentMonths: 3,
			deferredAmount: 900,
		});
	});

	it("does not apply a deferment after two regular deferments were used", async () => {
		const result = await getDecision(90, 600, 2);

		expect(result).toMatchObject({
			status: "denied",
			daysPastDue: 90,
			adjustedDaysPastDue: 90,
			adjustedPastDueBalance: 600,
			regularDefermentAvailable: false,
			regularDefermentApplied: false,
			defermentMonths: 0,
			deferredAmount: 0,
		});
	});
});
