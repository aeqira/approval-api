import { useCallback, useEffect, useState, type FormEvent } from "react";
import { API_ROUTES } from "../config/api";
import {
	copyTextToClipboard,
	formatCurrency,
	formatSubmittedAt,
	getErrorMessage,
	getStatusLabel,
	readApiResponse,
	splitOriginalComment,
} from "../functions/helpers";
import type {
	ApprovalSubmission,
	ApprovalSubmissionsResponse,
	SortDirection,
	SubmissionFilters,
	SubmissionSortField,
} from "../types/approval";

const EMPTY_FILTERS: SubmissionFilters = {
	search: "",
	status: "",
	defermentApplied: "",
	dateFrom: "",
	dateTo: "",
};

export function SubmissionsView() {
	const [submissions, setSubmissions] = useState<ApprovalSubmission[]>([]);
	const [draftFilters, setDraftFilters] =
		useState<SubmissionFilters>(EMPTY_FILTERS);
	const [filters, setFilters] = useState<SubmissionFilters>(EMPTY_FILTERS);
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

			if (filters.search) {
				url.searchParams.set("search", filters.search);
			}

			if (filters.status) {
				url.searchParams.set("status", filters.status);
			}

			if (filters.defermentApplied) {
				url.searchParams.set("defermentApplied", filters.defermentApplied);
			}

			if (filters.dateFrom) {
				url.searchParams.set("dateFrom", filters.dateFrom);
			}

			if (filters.dateTo) {
				url.searchParams.set("dateTo", filters.dateTo);
			}

			url.searchParams.set("sortBy", sortBy);
			url.searchParams.set("sortDirection", sortDirection);
			url.searchParams.set("page", String(page));
			url.searchParams.set("pageSize", "25");

			const response = await fetch(url, {
				headers: {
					Accept: "application/json",
				},
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

	useEffect(() => {
		if (!selectedSubmission) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setSelectedSubmission(null);
			}
		}

		const previousOverflow = document.body.style.overflow;

		document.body.style.overflow = "hidden";
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [selectedSubmission]);

	function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setPage(1);
		setFilters({
			...draftFilters,
			search: draftFilters.search.trim(),
		});
	}

	function handleClearFilters() {
		setDraftFilters(EMPTY_FILTERS);
		setFilters(EMPTY_FILTERS);
		setSortBy("createdAt");
		setSortDirection("desc");
		setPage(1);
		setSelectedSubmission(null);
	}

	async function copyAccountComment(comment: string) {
		await copyTextToClipboard(comment);
	}

	return (
		<section className="workspace-panel submissions-view">
			<div className="panel-heading submissions-heading">
				<div>
					<h2>All Submissions</h2>
					<p>
						Search and review payment-plan decisions submitted by all employees
					</p>
				</div>

				<span className="submission-count">
					{total} {total === 1 ? "submission" : "submissions"}
				</span>
			</div>

			<form className="submission-filters" onSubmit={handleApplyFilters}>
				<label>
					<span>Search</span>
					<input
						type="search"
						placeholder="Member number, employee name, or email"
						value={draftFilters.search}
						onChange={(event) =>
							setDraftFilters((current) => ({
								...current,
								search: event.target.value,
							}))
						}
					/>
				</label>

				<label>
					<span>Status</span>
					<select
						value={draftFilters.status}
						onChange={(event) =>
							setDraftFilters((current) => ({
								...current,
								status: event.target.value as SubmissionFilters["status"],
							}))
						}
					>
						<option value="">All statuses</option>
						<option value="approved">Approved</option>
						<option value="denied">Denied</option>
						<option value="manager_review">Manager Review</option>
					</select>
				</label>

				<label>
					<span>Deferment</span>
					<select
						value={draftFilters.defermentApplied}
						onChange={(event) =>
							setDraftFilters((current) => ({
								...current,
								defermentApplied: event.target
									.value as SubmissionFilters["defermentApplied"],
							}))
						}
					>
						<option value="">All submissions</option>
						<option value="true">Applied</option>
						<option value="false">Not applied</option>
					</select>
				</label>

				<label>
					<span>From</span>
					<input
						type="date"
						value={draftFilters.dateFrom}
						onChange={(event) =>
							setDraftFilters((current) => ({
								...current,
								dateFrom: event.target.value,
							}))
						}
					/>
				</label>

				<label>
					<span>To</span>
					<input
						type="date"
						value={draftFilters.dateTo}
						onChange={(event) =>
							setDraftFilters((current) => ({
								...current,
								dateTo: event.target.value,
							}))
						}
					/>
				</label>

				<label>
					<span>Sort By</span>
					<select
						value={sortBy}
						onChange={(event) => {
							setSortBy(event.target.value as SubmissionSortField);
							setPage(1);
						}}
					>
						<option value="createdAt">Submission Date</option>
						<option value="memberNumber">Member Number</option>
						<option value="status">Status</option>
						<option value="daysPastDue">Adjusted Days Delinquent</option>
						<option value="pastDueBalance">Adjusted Delinquent Balance</option>
						<option value="numberOfPayments">Payment Count</option>
					</select>
				</label>

				<label>
					<span>Direction</span>
					<select
						value={sortDirection}
						onChange={(event) => {
							setSortDirection(event.target.value as SortDirection);
							setPage(1);
						}}
					>
						<option value="desc">Descending</option>
						<option value="asc">Ascending</option>
					</select>
				</label>

				<div className="submission-filter-actions">
					<button className="primary-button" type="submit">
						Apply Filters
					</button>

					<button
						className="secondary-button"
						type="button"
						onClick={handleClearFilters}
					>
						Clear Filters
					</button>
				</div>
			</form>

			{isLoading && (
				<div className="result-state">
					<h3>Loading Submissions...</h3>
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
				<>
					<div className="submission-table-wrapper">
						<table className="submission-table">
							<thead>
								<tr>
									<th>Submitted</th>
									<th>Member</th>
									<th>Associate</th>
									<th>Status</th>
									<th>Adjusted Balance</th>
									<th>Plan Payment</th>
									<th>Payments</th>
									<th>Deferment</th>
									<th>Comments</th>
								</tr>
							</thead>

							<tbody>
								{submissions.map((submission) => (
									<tr key={submission.reviewId}>
										<td>{formatSubmittedAt(submission.createdAt)}</td>
										<td>{submission.memberNumber}</td>
										<td>{submission.associateDisplayName}</td>
										<td>
											<span
												className={`decision-status decision-status--${submission.currentStatus.replaceAll("_", "-")}`}
											>
												{getStatusLabel(submission.currentStatus)}
											</span>
										</td>
										<td>{formatCurrency(submission.adjustedPastDueBalance)}</td>
										<td>{formatCurrency(submission.planPayment)}</td>
										<td>{submission.numberOfPayments}</td>
										<td>
											{submission.regularDefermentApplied
												? `${submission.defermentMonths} months`
												: "Not applied"}
										</td>
										<td>
											<button
												className="submission-comment-button"
												type="button"
												onClick={() => setSelectedSubmission(submission)}
											>
												View Comment
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="submission-pagination">
						<button
							className="secondary-button"
							disabled={page <= 1}
							type="button"
							onClick={() => setPage((current) => Math.max(1, current - 1))}
						>
							Previous
						</button>

						<span>
							Page {page} of {totalPages}
						</span>

						<button
							className="secondary-button"
							disabled={page >= totalPages}
							type="button"
							onClick={() =>
								setPage((current) => Math.min(totalPages, current + 1))
							}
						>
							Next
						</button>
					</div>
				</>
			)}

			{selectedSubmission && (
				<div
					className="comment-modal-backdrop"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) {
							setSelectedSubmission(null);
						}
					}}
				>
					<section
						aria-labelledby="comment-modal-title"
						aria-modal="true"
						className="comment-modal"
						role="dialog"
					>
						<div className="comment-modal-heading">
							<div>
								<p>Member {selectedSubmission.memberNumber}</p>
								<h2 id="comment-modal-title">Account Comment</h2>
							</div>

							<button
								aria-label="Close account comment"
								autoFocus
								className="comment-modal-close"
								type="button"
								onClick={() => setSelectedSubmission(null)}
							>
								×
							</button>
						</div>

						<div className="comment-modal-content">
							{selectedSubmission.accountComment
								.split("\n\n")
								.filter(Boolean)
								.map((block, blockIndex) => {
									const entries =
										blockIndex === 0
											? splitOriginalComment(block)
											: block.split("\n").filter(Boolean);

									return (
										<div
											className={`comment-log comment-log--${blockIndex === 0 ? "original" : "manager"}`}
											key={block}
										>
											<h3>
												{blockIndex === 0
													? "Original Decision Log"
													: "Manager Decision Log"}
											</h3>
											<ul>
												{entries.map((line) => (
													<li key={line}>{line}</li>
												))}
											</ul>
										</div>
									);
								})}
						</div>

						<div className="comment-modal-actions">
							<button
								className="secondary-button"
								type="button"
								onClick={() =>
									void copyAccountComment(selectedSubmission.accountComment)
								}
							>
								Copy Comment
							</button>

							<button
								className="primary-button"
								type="button"
								onClick={() => setSelectedSubmission(null)}
							>
								Close
							</button>
						</div>
					</section>
				</div>
			)}
		</section>
	);
}
