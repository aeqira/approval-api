import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { API_ROUTES } from "../src/config/api";
import type {
	ApprovalResponse,
	ApprovalSubmissionsResponse,
	ManagerDecisionResponse,
	ManagerReviewsResponse,
} from "../src/types/approval";

function getDateDaysAgo(days: number): string {
	const date = new Date();

	date.setUTCHours(0, 0, 0, 0);
	date.setUTCDate(date.getUTCDate() - days);

	return date.toISOString().slice(0, 10);
}

const defaultPastDueDate = getDateDaysAgo(20);

async function submitApproval(
	body: Record<string, unknown>,
	associateEmail = "associate@aeqira.com",
) {
	return SELF.fetch(
		new URL(API_ROUTES.approval, "https://example.com").toString(),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"CF-Access-Authenticated-User-Email": associateEmail,
			},
			body: JSON.stringify({
				memberNumber: "123456",
				pastDueDate: defaultPastDueDate,
				...body,
			}),
		},
	);
}

async function readApprovalResponse(
	response: Response,
): Promise<ApprovalResponse> {
	return (await response.json()) as ApprovalResponse;
}

describe("API routing", () => {
	it.each([
		[API_ROUTES.health, "POST", "GET"],
		[API_ROUTES.identity, "POST", "GET"],
		[API_ROUTES.submissions, "POST", "GET"],
		[API_ROUTES.managerReviews, "POST", "GET"],
		[API_ROUTES.managerReview("00000000-0000-4000-8000-000000000000"), "GET", "PATCH"],
		[API_ROUTES.approval, "GET", "POST"],
	])(
		"returns a no-store 405 response for %s",
		async (path, method, allowedMethod) => {
			const response = await SELF.fetch(
				new URL(path, "https://example.com").toString(),
				{ method },
			);

			expect(response.status).toBe(405);
			expect(response.headers.get("Allow")).toBe(allowedMethod);
			expect(response.headers.get("Cache-Control")).toBe("no-store");
			expect(await response.json()).toEqual({ error: "Method not allowed" });
		},
	);
});

describe("Identity API", () => {
	it("returns the authenticated associate email", async () => {
		const response = await SELF.fetch(
			new URL(API_ROUTES.identity, "https://example.com").toString(),
			{
				headers: {
					"CF-Access-Authenticated-User-Email": "Associate@Aeqira.com",
				},
			},
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(await response.json()).toEqual({
			email: "associate@aeqira.com",
			displayName: "associate@aeqira.com",
			role: "associate",
		});
	});

	it("rejects a request without an authenticated identity", async () => {
		const response = await SELF.fetch(
			new URL(API_ROUTES.identity, "https://example.com").toString(),
		);

		expect(response.status).toBe(401);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(await response.json()).toEqual({
			error: "Authentication required",
		});
	});

	it("returns the manager role for an active manager", async () => {
		await env.approval_api_db
			.prepare(
				`
					INSERT INTO users (
						email,
						display_name,
						role
					)
					VALUES (?, ?, ?)
				`,
			)
			.bind("manager@aeqira.com", "Test Manager", "manager")
			.run();

		const response = await SELF.fetch(
			new URL(API_ROUTES.identity, "https://example.com").toString(),
			{
				headers: {
					"CF-Access-Authenticated-User-Email": "Manager@Aeqira.com",
				},
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			email: "manager@aeqira.com",
			displayName: "Test Manager",
			role: "manager",
		});
	});
});

describe("Manager Reviews API", () => {
	it("rejects an associate", async () => {
		const response = await SELF.fetch(
			new URL(API_ROUTES.managerReviews, "https://example.com").toString(),
			{
				headers: {
					"CF-Access-Authenticated-User-Email": "associate@aeqira.com",
				},
			},
		);

		expect(response.status).toBe(403);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(await response.json()).toEqual({
			error: "Manager access required",
		});
	});

	it("returns pending reviews to an active manager", async () => {
		await env.approval_api_db
			.prepare(
				`
					INSERT OR REPLACE INTO users (
						email,
						display_name,
						role,
						active
					)
					VALUES (?, ?, ?, ?)
				`,
			)
			.bind("manager@aeqira.com", "Test Manager", "manager", 1)
			.run();

		const approvalResponse = await submitApproval({
			pastDueDate: getDateDaysAgo(45),
			pastDueBalance: 600,
			monthlyPayment: 300,
			regularDefermentCount: 2,
			paymentChoice: {
				type: "minimum_plus_extra",
				extraAmount: 100,
			},
		});

		expect(approvalResponse.status).toBe(200);

		const approval = (await approvalResponse.json()) as ApprovalResponse;

		const response = await SELF.fetch(
			new URL(API_ROUTES.managerReviews, "https://example.com").toString(),
			{
				headers: {
					"CF-Access-Authenticated-User-Email": "manager@aeqira.com",
				},
			},
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toBe("no-store");

		const body = (await response.json()) as ManagerReviewsResponse;

		expect(body.reviews).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					reviewId: approval.reviewId,
					memberNumber: "123456",
					associateEmail: "associate@aeqira.com",
					associateDisplayName: "associate@aeqira.com",
					daysPastDue: 45,
					numberOfPayments: 6,
				}),
			]),
		);
	});

	it("allows a manager to approve a pending review once", async () => {
		await env.approval_api_db
			.prepare(
				`
					INSERT OR REPLACE INTO users (
						email,
						display_name,
						role,
						active
					)
					VALUES (?, ?, ?, ?)
				`,
			)
			.bind("manager@aeqira.com", "Test Manager", "manager", 1)
			.run();

		const approvalResponse = await submitApproval({
			pastDueDate: getDateDaysAgo(45),
			pastDueBalance: 600,
			monthlyPayment: 300,
			regularDefermentCount: 2,
			paymentChoice: {
				type: "minimum_plus_extra",
				extraAmount: 100,
			},
		});

		const approval = (await approvalResponse.json()) as ApprovalResponse;

		const response = await SELF.fetch(
			new URL(
				API_ROUTES.managerReview(approval.reviewId),
				"https://example.com",
			).toString(),
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"CF-Access-Authenticated-User-Email": "manager@aeqira.com",
				},
				body: JSON.stringify({
					status: "approved",
					reason: "Payment history supports approval.",
				}),
			},
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toBe("no-store");

		const decision = (await response.json()) as ManagerDecisionResponse;

		expect(decision).toEqual({
			reviewId: approval.reviewId,
			status: "approved",
			managerEmail: "manager@aeqira.com",
			managerDisplayName: "Test Manager",
			managerReason: "Payment history supports approval.",
			accountComment: `${approval.accountComment}\n\nManager decision: APPROVED.\nManager: Test Manager.\nManager decision reason: Payment history supports approval.`,
			reviewedAt: expect.any(String),
		});

		const storedReview = await env.approval_api_db
			.prepare(
				`
					SELECT
						initial_status,
						current_status,
						manager_email,
						manager_reason,
						final_account_comment
					FROM approval_reviews
					WHERE id = ?
				`,
			)
			.bind(approval.reviewId)
			.first<{
				initial_status: string;
				current_status: string;
				manager_email: string;
				manager_reason: string;
				final_account_comment: string;
			}>();

		expect(storedReview).toEqual({
			initial_status: "manager_review",
			current_status: "approved",
			manager_email: "manager@aeqira.com",
			manager_reason: "Payment history supports approval.",
			final_account_comment: `${approval.accountComment}\n\nManager decision: APPROVED.\nManager: Test Manager.\nManager decision reason: Payment history supports approval.`,
		});

		const repeatedResponse = await SELF.fetch(
			new URL(
				API_ROUTES.managerReview(approval.reviewId),
				"https://example.com",
			).toString(),
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"CF-Access-Authenticated-User-Email": "manager@aeqira.com",
				},
				body: JSON.stringify({
					status: "denied",
					reason: "Attempted second decision.",
				}),
			},
		);

		expect(repeatedResponse.status).toBe(404);
		expect(await repeatedResponse.json()).toEqual({
			error: "Pending manager review not found",
		});
	});

	it("prevents associates from deciding and allows a manager to deny", async () => {
		await env.approval_api_db
			.prepare(
				`
					INSERT OR REPLACE INTO users (
						email,
						display_name,
						role,
						active
					)
					VALUES (?, ?, ?, ?)
				`,
			)
			.bind("manager@aeqira.com", "Test Manager", "manager", 1)
			.run();

		const approvalResponse = await submitApproval({
			pastDueDate: getDateDaysAgo(45),
			pastDueBalance: 600,
			monthlyPayment: 300,
			regularDefermentCount: 2,
			paymentChoice: {
				type: "minimum_plus_extra",
				extraAmount: 100,
			},
		});

		const approval = (await approvalResponse.json()) as ApprovalResponse;

		const associateResponse = await SELF.fetch(
			new URL(
				API_ROUTES.managerReview(approval.reviewId),
				"https://example.com",
			).toString(),
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"CF-Access-Authenticated-User-Email": "associate@aeqira.com",
				},
				body: JSON.stringify({
					status: "denied",
					reason: "Associate should not decide.",
				}),
			},
		);

		expect(associateResponse.status).toBe(403);
		expect(await associateResponse.json()).toEqual({
			error: "Manager access required",
		});

		const managerResponse = await SELF.fetch(
			new URL(
				API_ROUTES.managerReview(approval.reviewId),
				"https://example.com",
			).toString(),
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"CF-Access-Authenticated-User-Email": "manager@aeqira.com",
				},
				body: JSON.stringify({
					status: "denied",
					reason: "The proposed arrangement is not supportable.",
				}),
			},
		);

		expect(managerResponse.status).toBe(200);
		expect(await managerResponse.json()).toEqual({
			reviewId: approval.reviewId,
			status: "denied",
			managerEmail: "manager@aeqira.com",
			managerDisplayName: "Test Manager",
			managerReason: "The proposed arrangement is not supportable.",
			accountComment: `${approval.accountComment}\n\nManager decision: DENIED.\nManager: Test Manager.\nManager decision reason: The proposed arrangement is not supportable.`,
			reviewedAt: expect.any(String),
		});
	});
});

describe("Approval API", () => {
	it("rejects a future past-due date", async () => {
		const tomorrow = new Date();

		tomorrow.setUTCHours(0, 0, 0, 0);
		tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

		const response = await submitApproval({
			pastDueDate: tomorrow.toISOString().slice(0, 10),
			pastDueBalance: 600,
			monthlyPayment: 300,
			regularDefermentCount: 2,
			paymentChoice: {
				type: "minimum_plus_extra",
				extraAmount: 100,
			},
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "Invalid approval request",
			requiredFields: [
				"memberNumber",
				"pastDueDate",
				"pastDueBalance",
				"monthlyPayment",
				"regularDefermentCount",
				"paymentChoice",
			],
		});
	});

	it("approves an eligible minimum-plus-extra plan", async () => {
		const response = await submitApproval({
			pastDueBalance: 600,
			monthlyPayment: 300,
			regularDefermentCount: 1,
			paymentChoice: {
				type: "minimum_plus_extra",
				extraAmount: 100,
			},
		});

		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(response.status).toBe(200);

		const result = await readApprovalResponse(response);

		expect(result).toEqual({
			reviewId: expect.any(String),
			status: "approved",
			daysPastDue: 20,
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
			reasons: [
				"Approved for 3-month deferment only; no payment plan is required.",
			],
			accountComment: expect.stringContaining(
				"Regular deferment applied for 3 months; $600.00 deferred.",
			),
		});
	});

	it("sends 31–89 days past due to manager review", async () => {
		const response = await submitApproval({
			pastDueBalance: 600,
			monthlyPayment: 300,
			pastDueDate: getDateDaysAgo(45),
			regularDefermentCount: 2,
			paymentChoice: {
				type: "minimum_plus_extra",
				extraAmount: 100,
			},
		});

		const result = await readApprovalResponse(response);

		expect(result.status).toBe("manager_review");
		expect(result.regularDefermentAvailable).toBe(false);
		expect(result.reasons).toContain(
			"The loan remains between 31 and 89 days delinquent after deferment.",
		);
	});

	it("sends a 13–18 payment plan to manager review", async () => {
		const response = await submitApproval({
			pastDueBalance: 1300,
			monthlyPayment: 300,
			regularDefermentCount: 2,
			paymentChoice: {
				type: "minimum_plus_extra",
				extraAmount: 100,
			},
		});

		const result = await readApprovalResponse(response);

		expect(result.status).toBe("manager_review");
		expect(result.numberOfPayments).toBe(13);
	});

	it("denies plans requiring more than 18 payments", async () => {
		const response = await submitApproval({
			pastDueBalance: 1900,
			monthlyPayment: 300,
			regularDefermentCount: 2,
			paymentChoice: {
				type: "minimum_plus_extra",
				extraAmount: 100,
			},
		});

		const result = await readApprovalResponse(response);

		expect(result.status).toBe("denied");
		expect(result.reasons).toContain(
			"The plan requires more than 18 payments.",
		);
	});

	it("denies an affordable payment that does not exceed the minimum", async () => {
		const response = await submitApproval({
			pastDueBalance: 600,
			monthlyPayment: 300,
			regularDefermentCount: 2,
			paymentChoice: {
				type: "affordable_payment",
				affordablePayment: 300,
			},
		});

		const result = await readApprovalResponse(response);

		expect(result.status).toBe("denied");
		expect(result.reasons).toContain(
			"The proposed payment must exceed the regular monthly payment.",
		);
	});
});

describe("Submissions API", () => {
	it("allows an authenticated associate to search submission history", async () => {
		const historyAssociateEmail = "history-associate@aeqira.com";

		await env.approval_api_db
			.prepare(
				`
					INSERT OR REPLACE INTO users (
						email,
						display_name,
						role,
						active
					)
					VALUES (?, ?, ?, ?)
				`,
			)
			.bind(
				historyAssociateEmail,
				"Test Associate",
				"associate",
				1,
			)
			.run();

		const approvalResponse = await submitApproval(
			{
				memberNumber: "HISTORY-TEST-001",
				pastDueBalance: 600,
				monthlyPayment: 300,
				regularDefermentCount: 0,
				paymentChoice: {
					type: "minimum_plus_extra",
					extraAmount: 100,
				},
			},
			historyAssociateEmail,
		);

		expect(approvalResponse.status).toBe(200);

		const url = new URL(API_ROUTES.submissions, "https://example.com");

		url.searchParams.set("search", "Test Associate");
		url.searchParams.set("status", "approved");
		url.searchParams.set("defermentApplied", "true");
		url.searchParams.set("sortBy", "createdAt");
		url.searchParams.set("sortDirection", "desc");
		url.searchParams.set("page", "1");
		url.searchParams.set("pageSize", "10");

		const response = await SELF.fetch(url.toString(), {
			headers: {
				"CF-Access-Authenticated-User-Email": historyAssociateEmail,
			},
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toBe("no-store");

		const result = (await response.json()) as ApprovalSubmissionsResponse;

		expect(result.total).toBe(1);
		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(10);
		expect(result.totalPages).toBe(1);
		expect(result.submissions).toEqual([
				expect.objectContaining({
					memberNumber: "HISTORY-TEST-001",
					associateEmail: historyAssociateEmail,
					associateDisplayName: "Test Associate",
				currentStatus: "approved",
				regularDefermentApplied: true,
				defermentMonths: 3,
				deferredAmount: 600,
			}),
		]);
	});
});
