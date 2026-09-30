import { useCallback, useEffect, useState, type FormEvent } from "react";
import { API_ROUTES } from "../config/api";
import { getErrorMessage, readApiResponse } from "../functions/helpers";
import type {
	ApprovalSubmission,
	ApprovalSubmissionsResponse,
	SortDirection,
	SubmissionFilters as SubmissionFilterValues,
	SubmissionSortField,
} from "../types/approval";
import { AccountCommentModal } from "./AccountCommentModal";
import { LoadingIndicator } from "./LoadingIndicator";
import { SubmissionFilters } from "./SubmissionFilters";
import { SubmissionsTable } from "./SubmissionsTable";

const EMPTY_FILTERS: SubmissionFilterValues = {
	search: "",
	status: "",
	defermentApplied: "",
	dateFrom: "",
	dateTo: "",
};

export function SubmissionsView() {
	const [submissions, setSubmissions] = useState<ApprovalSubmission[]>([]);
	const [draftFilters, setDraftFilters] =
		useState<SubmissionFilterValues>(EMPTY_FILTERS);
	const [filters, setFilters] = useState<SubmissionFilterValues>(EMPTY_FILTERS);
	const [sortBy, setSortBy] = useState<SubmissionSortField>("createdAt");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedSubmission, setSelectedSubmission] =
		useState<ApprovalSubmission | null>(null);

	const loadSubmissions = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const url = new URL(API_ROUTES.submissions, window.location.origin);

			for (const [key, value] of Object.entries(filters)) {
				if (value) {
					url.searchParams.set(key, value);
				}
			}

			url.searchParams.set("sortBy", sortBy);
			url.searchParams.set("sortDirection", sortDirection);
			url.searchParams.set("page", String(page));
			url.searchParams.set("pageSize", "25");

			const response = await fetch(url, {
				headers: { Accept: "application/json" },
			});
			const body = await readApiResponse<ApprovalSubmissionsResponse>(
				response,
				"Unable to load submissions",
			);

			setSubmissions(body.submissions);
			setTotal(body.total);
			setTotalPages(body.totalPages);
		} catch (caughtError) {
			setError(getErrorMessage(caughtError, "Unable to load submissions"));
		} finally {
			setIsLoading(false);
		}
	}, [filters, page, sortBy, sortDirection]);

	useEffect(() => {
		void loadSubmissions();
	}, [loadSubmissions]);

	function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setPage(1);
		setFilters({ ...draftFilters, search: draftFilters.search.trim() });
	}

	function handleClearFilters() {
		setDraftFilters(EMPTY_FILTERS);
		setFilters(EMPTY_FILTERS);
		setSortBy("createdAt");
		setSortDirection("desc");
		setPage(1);
		setSelectedSubmission(null);
	}

	return (
		<section className="workspace-panel submissions-view">
			<div className="panel-heading submissions-heading">
				<div>
					<h2 className="heading-with-icon">
						<ClipboardTaskListLtr24Regular aria-hidden="true" />
						All Submissions
					</h2>
					<p>
						Search and review payment-plan decisions submitted by all employees
					</p>
				</div>
				<span className="submission-count">
					{total} {total === 1 ? "submission" : "submissions"}
				</span>
			</div>

			<SubmissionFilters
				filters={draftFilters}
				sortBy={sortBy}
				sortDirection={sortDirection}
				onApply={handleApplyFilters}
				onChange={setDraftFilters}
				onClear={handleClearFilters}
				onSortByChange={(value) => {
					setSortBy(value);
					setPage(1);
				}}
				onSortDirectionChange={(value) => {
					setSortDirection(value);
					setPage(1);
				}}
			/>

			{isLoading && (
				<div className="result-state">
					<LoadingIndicator label="Loading Submissions..." />
				</div>
			)}

			{!isLoading && error && (
				<div className="result-state result-state--error" role="alert">
					<h3>Unable to Load Submissions</h3>
					<p>{error}</p>
				</div>
			)}

			{!isLoading && !error && submissions.length === 0 && (
				<div className="result-state">
					<h3>No Submissions Found</h3>
					<p>Try changing or clearing the current filters.</p>
				</div>
			)}

			{!isLoading && !error && submissions.length > 0 && (
				<SubmissionsTable
					submissions={submissions}
					page={page}
					totalPages={totalPages}
					onPageChange={setPage}
					onViewComment={setSelectedSubmission}
				/>
			)}

			{selectedSubmission && (
				<AccountCommentModal
					submission={selectedSubmission}
					onClose={() => setSelectedSubmission(null)}
				/>
			)}
		</section>
	);
}
import { ClipboardTaskListLtr24Regular } from "@fluentui/react-icons/svg/clipboard-task-list-ltr";
