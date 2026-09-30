import { ArrowLeft24Regular } from "@fluentui/react-icons/svg/arrow-left";
import { ArrowRight24Regular } from "@fluentui/react-icons/svg/arrow-right";
import { CalendarArrowCounterclockwise24Regular } from "@fluentui/react-icons/svg/calendar-arrow-counterclockwise";
import { Clock24Regular } from "@fluentui/react-icons/svg/clock";
import { Eye24Regular } from "@fluentui/react-icons/svg/eye";
import { Money24Regular } from "@fluentui/react-icons/svg/money";
import { NumberSymbol24Regular } from "@fluentui/react-icons/svg/number-symbol";
import {
	formatCurrency,
	formatSubmittedAt,
	getStatusLabel,
} from "../functions/helpers";
import type { SubmissionsTableProps } from "../types/approval";
import { AssociateIdentity } from "./AssociateIdentity";
import { DecisionStatusIcon } from "./DecisionStatusIcon";

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
					<colgroup>
						<col className="submission-column--submitted" />
						<col className="submission-column--member" />
						<col className="submission-column--associate" />
						<col className="submission-column--status" />
						<col className="submission-column--balance" />
						<col className="submission-column--payment" />
						<col className="submission-column--count" />
						<col className="submission-column--deferment" />
						<col className="submission-column--comments" />
					</colgroup>
					<thead>
						<tr>
							<th scope="col">Submitted</th>
							<th scope="col">Member</th>
							<th scope="col">Associate</th>
							<th scope="col">Status</th>
							<th scope="col">Adjusted Balance</th>
							<th scope="col">Plan Payment</th>
							<th scope="col">Payments</th>
							<th scope="col">Deferment</th>
							<th scope="col">Comments</th>
						</tr>
					</thead>
					<tbody>
						{submissions.map((submission) => (
							<tr key={submission.reviewId}>
								<td className="submission-cell--submitted">
									<span className="submission-metric-value">
										<Clock24Regular aria-hidden="true" />
										{formatSubmittedAt(submission.createdAt)}
									</span>
								</td>
								<td className="submission-cell--member">
									{submission.memberNumber}
								</td>
								<td className="submission-cell--associate">
									<AssociateIdentity
										badgePhoto={submission.associateBadgePhoto}
										displayName={submission.associateDisplayName}
									/>
								</td>
								<td className="submission-cell--status">
									<span
										className={`decision-status decision-status--${submission.currentStatus.replaceAll("_", "-")}`}
									>
										<DecisionStatusIcon status={submission.currentStatus} />
										{getStatusLabel(submission.currentStatus)}
									</span>
								</td>
								<td className="submission-cell--money">
									<span className="submission-metric-value">
										<Money24Regular aria-hidden="true" />
										{formatCurrency(submission.adjustedPastDueBalance)}
									</span>
								</td>
								<td className="submission-cell--money">
									<span className="submission-metric-value">
										<Money24Regular aria-hidden="true" />
										{formatCurrency(submission.planPayment)}
									</span>
								</td>
								<td className="submission-cell--count">
									<span className="submission-metric-value">
										<NumberSymbol24Regular aria-hidden="true" />
										{submission.numberOfPayments}
									</span>
								</td>
								<td className="submission-cell--deferment">
									<span className="submission-deferment-value">
										<CalendarArrowCounterclockwise24Regular aria-hidden="true" />
										{submission.regularDefermentApplied
											? `${submission.defermentMonths} months`
											: "Not applied"}
									</span>
								</td>
								<td className="submission-cell--comments">
									<button
										className="submission-comment-button"
										type="button"
										onClick={() => onViewComment(submission)}
									>
										<Eye24Regular aria-hidden="true" />
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
					<ArrowLeft24Regular aria-hidden="true" />
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
					<ArrowRight24Regular aria-hidden="true" />
				</button>
			</div>
		</>
	);
}
