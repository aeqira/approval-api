import {
	formatCurrency,
	formatSubmittedAt,
	getStatusLabel,
} from "../functions/helpers";
import type { SubmissionsTableProps } from "../types/approval";

export function SubmissionsTable({
	submissions,
	page,
	totalPages,
	onPageChange,
	onViewComment,
}: SubmissionsTableProps) {
	return (
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
										onClick={() => onViewComment(submission)}
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
					onClick={() => onPageChange(Math.max(1, page - 1))}
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
					onClick={() => onPageChange(Math.min(totalPages, page + 1))}
				>
					Next
				</button>
			</div>
		</>
	);
}
