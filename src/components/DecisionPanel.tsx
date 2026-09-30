import {
	copyTextToClipboard,
	formatCurrency,
	getStatusLabel,
} from "../functions/helpers";
import type { DecisionPanelProps } from "../types/approval";

export function DecisionPanel({
	error,
	isSubmitting,
	result,
}: DecisionPanelProps) {
	async function copyAccountComment() {
		if (!result?.accountComment) {
			return;
		}

		await copyTextToClipboard(result.accountComment);
	}

	return (
		<section className="workspace-panel result-panel">
			<div className="panel-heading">
				<h2>Payment Plan Result</h2>
			</div>

			{isSubmitting && (
				<div className="result-state">
					<h3>Evaluating Plan...</h3>
					<p>Applying decision criteria</p>
				</div>
			)}

			{!isSubmitting && error && (
				<div className="result-state result-state--error" role="alert">
					<h3>Unable to Evaluate Plan</h3>
					<p>{error}</p>
				</div>
			)}

			{!isSubmitting && !error && !result && (
				<div className="result-state">
					<div className="empty-state-icon" aria-hidden="true">
						✓
					</div>

					<h3>No Result Yet</h3>
					<p>
						Complete the loan information and select a payment option, then
						choose Evaluate Plan
					</p>

					<div className="result-includes">
						<h4>The result will include:</h4>
						<ul>
							<li>Decision and decision reasons</li>
							<li>Payment amount and term</li>
							<li>Final payment</li>
							<li>Deferment availability</li>
							<li>An account comment</li>
						</ul>
					</div>
				</div>
			)}

			{!isSubmitting && !error && result && (
				<div className="decision-result">
					<div
						className={`decision-status decision-status--${result.status.replaceAll("_", "-")}`}
					>
						{getStatusLabel(result.status)}
					</div>

					<dl className="decision-summary">
						<div>
							<dt>Adjusted Days Delinquent</dt>
							<dd>{result.adjustedDaysPastDue}</dd>
						</div>

						<div>
							<dt>Adjusted Delinquent Balance</dt>
							<dd>{formatCurrency(result.adjustedPastDueBalance)}</dd>
						</div>

						<div>
							<dt>Plan Payment</dt>
							<dd>{formatCurrency(result.planPayment)}</dd>
						</div>

						<div>
							<dt>Payment Count</dt>
							<dd>{result.numberOfPayments}</dd>
						</div>

						<div>
							<dt>Final Payment</dt>
							<dd>{formatCurrency(result.finalPayment)}</dd>
						</div>

						<div>
							<dt>Regular Deferment</dt>
							<dd>
								{result.regularDefermentApplied
									? `${result.defermentMonths} months — ${formatCurrency(result.deferredAmount)}`
									: "Not Available"}
							</dd>
						</div>
					</dl>

					<div className="decision-reasons">
						<h3>Decision Reasons</h3>
						<ul>
							{result.reasons.map((reason) => (
								<li key={reason}>{reason}</li>
							))}
						</ul>
					</div>

					{result.accountComment && (
						<div className="account-comment">
							<div className="account-comment-heading">
								<h3>Account Comment</h3>

								<button
									className="secondary-button"
									type="button"
									onClick={copyAccountComment}
								>
									Copy Comment
								</button>
							</div>

							<p>{result.accountComment}</p>
						</div>
					)}
				</div>
			)}
		</section>
	);
}
