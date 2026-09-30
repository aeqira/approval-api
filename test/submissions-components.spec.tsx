import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccountCommentModal } from "../src/components/AccountCommentModal";
import { SubmissionFilters } from "../src/components/SubmissionFilters";
import { SubmissionsTable } from "../src/components/SubmissionsTable";
import type { ApprovalSubmission } from "../src/types/approval";

const submission: ApprovalSubmission = {
	reviewId: "review-1",
	memberNumber: "MEMBER-001",
	associateEmail: "associate@aeqira.com",
	associateDisplayName: "Test Associate",
	pastDueDate: "2026-08-01",
	daysPastDue: 45,
	adjustedDaysPastDue: 0,
	pastDueBalance: 600,
	adjustedPastDueBalance: 0,
	monthlyPayment: 300,
	planPayment: 400,
	numberOfPayments: 0,
	regularDefermentApplied: true,
	defermentMonths: 3,
	deferredAmount: 600,
	initialStatus: "manager_review",
	currentStatus: "approved",
	reasons: ["Manager approval required."],
	managerEmail: "manager@aeqira.com",
	managerReason: "Approved after review.",
	reviewedAt: "2026-09-29T12:00:00.000Z",
	createdAt: "2026-09-29T11:00:00.000Z",
	accountComment:
		"Payment plan decision: MANAGER REVIEW. Member number: MEMBER-001.\n\nManager decision: APPROVED.\nManager: Test Manager.\nManager decision reason: Approved after review.",
};

describe("submission components", () => {
	it("renders the complete filter controls", () => {
		const markup = renderToStaticMarkup(
			<SubmissionFilters
				filters={{
					search: "MEMBER-001",
					status: "approved",
					defermentApplied: "true",
					dateFrom: "2026-09-01",
					dateTo: "2026-09-30",
				}}
				sortBy="createdAt"
				sortDirection="desc"
				onApply={() => undefined}
				onChange={() => undefined}
				onClear={() => undefined}
				onSortByChange={() => undefined}
				onSortDirectionChange={() => undefined}
			/>,
		);

		expect(markup).toContain("MEMBER-001");
		expect(markup).toContain("Apply Filters");
		expect(markup).toContain("Clear Filters");
	});

	it("renders submission values and comment action", () => {
		const markup = renderToStaticMarkup(
			<SubmissionsTable
				submissions={[submission]}
				page={1}
				totalPages={1}
				onPageChange={() => undefined}
				onViewComment={() => undefined}
			/>,
		);

		expect(markup).toContain("MEMBER-001");
		expect(markup).toContain("Test Associate");
		expect(markup).toContain("Approved");
		expect(markup).toContain("View Comment");
	});

	it("renders original and manager comments as separate logs", () => {
		const markup = renderToStaticMarkup(
			<AccountCommentModal submission={submission} onClose={() => undefined} />,
		);

		expect(markup).toContain("Original Decision Log");
		expect(markup).toContain("Manager Decision Log");
		expect(markup).toContain("Approved after review.");
	});
});
