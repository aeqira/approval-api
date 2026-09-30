import { Calculator24Regular } from "@fluentui/react-icons/svg/calculator";
import { CalendarArrowCounterclockwise24Regular } from "@fluentui/react-icons/svg/calendar-arrow-counterclockwise";
import { CalendarClock24Regular } from "@fluentui/react-icons/svg/calendar-clock";
import { CheckmarkCircle24Regular } from "@fluentui/react-icons/svg/checkmark-circle";
import { Clipboard24Regular } from "@fluentui/react-icons/svg/clipboard";
import { DocumentBulletList24Regular } from "@fluentui/react-icons/svg/document-bullet-list";
import { Info24Regular } from "@fluentui/react-icons/svg/info";
import { Money24Regular } from "@fluentui/react-icons/svg/money";
import { NumberSymbol24Regular } from "@fluentui/react-icons/svg/number-symbol";
import { Payment24Regular } from "@fluentui/react-icons/svg/payment";
import {
	copyTextToClipboard,
	formatCurrency,
	getStatusLabel,
	splitOriginalComment,
} from "../functions/helpers";
import type { DecisionPanelProps } from "../types/approval";
import { PlanCalculationLoader } from "./PlanCalculationLoader";
import { DecisionStatusIcon } from "./DecisionStatusIcon";

export function DecisionPanel({
	calculationValues,
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
				<h2 className="heading-with-icon">
					<Calculator24Regular aria-hidden="true" />
					Payment Plan Result
				</h2>
			</div>

			{isSubmitting && calculationValues && (
				<div className="result-state">
					<PlanCalculationLoader values={calculationValues} />
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
						<CheckmarkCircle24Regular />
					</div>

					<h3>No Result Yet</h3>
					<p>
						Complete the loan information and select a payment option, then
						choose Evaluate Plan
					</p>

					<div className="result-includes">
						<h4 className="heading-with-icon">
							<Info24Regular aria-hidden="true" />
							The result will include:
						</h4>
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
						<DecisionStatusIcon status={result.status} />
						{getStatusLabel(result.status)}
					</div>

					<dl className="decision-summary">
						<div>
							<dt>
								<CalendarClock24Regular aria-hidden="true" />
								Adjusted Days Delinquent
							</dt>
							<dd>{result.adjustedDaysPastDue}</dd>
						</div>

						<div>
							<dt>
								<Money24Regular aria-hidden="true" />
								Adjusted Delinquent Balance
							</dt>
							<dd>{formatCurrency(result.adjustedPastDueBalance)}</dd>
						</div>

						<div>
							<dt>
								<Payment24Regular aria-hidden="true" />
								Plan Payment
							</dt>
							<dd>{formatCurrency(result.planPayment)}</dd>
						</div>

						<div>
							<dt>
								<NumberSymbol24Regular aria-hidden="true" />
								Payment Count
							</dt>
							<dd>{result.numberOfPayments}</dd>
						</div>

						<div>
							<dt>
								<Payment24Regular aria-hidden="true" />
								Final Payment
							</dt>
							<dd>{formatCurrency(result.finalPayment)}</dd>
						</div>

						<div>
							<dt>
								<CalendarArrowCounterclockwise24Regular aria-hidden="true" />
								Regular Deferment
							</dt>
							<dd>
								{result.regularDefermentApplied
									? `${result.defermentMonths} months, ${formatCurrency(result.deferredAmount)}`
									: "Not Available"}
							</dd>
						</div>
					</dl>

					<div className="decision-reasons">
						<h3 className="heading-with-icon">
							<DocumentBulletList24Regular aria-hidden="true" />
							Decision Reasons
						</h3>
						<ul>
							{result.reasons.map((reason) => (
								<li key={reason}>{reason}</li>
							))}
						</ul>
					</div>

					{result.accountComment && (
						<div className="account-comment">
							<div className="account-comment-heading">
								<h3 className="heading-with-icon">
									<Clipboard24Regular aria-hidden="true" />
									Account Comment
								</h3>

								<button
									className="secondary-button"
									type="button"
									onClick={copyAccountComment}
								>
									<Clipboard24Regular aria-hidden="true" />
									Copy Comment
								</button>
							</div>

							<ul className="account-comment-list">
								{splitOriginalComment(result.accountComment).map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</section>
	);
}
