import { Calculator24Regular } from "@fluentui/react-icons/svg/calculator";
import { formatCurrency } from "../functions/helpers";
import type { PlanCalculationLoaderProps } from "../types/approval";

function formatCalculatorDigits(value: number): string {
	return Math.round(value * 100).toString().padStart(8, "0").slice(-8);
}

export function PlanCalculationLoader({ values }: PlanCalculationLoaderProps) {
	const proposedPayment =
		values.paymentChoice.type === "minimum_plus_extra"
			? values.monthlyPayment + values.paymentChoice.extraAmount
			: values.paymentChoice.affordablePayment;
	const displayValues = [
		0,
		values.pastDueBalance,
		values.monthlyPayment,
		proposedPayment,
		values.regularDefermentCount,
	];

	return (
		<div className="plan-calculation-loader" role="status" aria-live="polite">
			<div className="calculation-machine" aria-hidden="true">
				<div className="calculation-machine-display">
					<span className="calculation-digits-track">
						{displayValues.map((value, index) => (
							<span key={`${index}-${value}`}>
								{formatCalculatorDigits(value)}
							</span>
						))}
					</span>
				</div>

				<div className="calculation-tape">
					<span>
						Balance <b>{formatCurrency(values.pastDueBalance)}</b>
					</span>
					<span>
						Monthly <b>{formatCurrency(values.monthlyPayment)}</b>
					</span>
					<span>
						Proposed <b>{formatCurrency(proposedPayment)}</b>
					</span>
					<span>
						Deferments <b>{values.regularDefermentCount}</b>
					</span>
					<span className="calculation-total">
						Checking plan <b>...</b>
					</span>
				</div>

				<span className="calculation-icon">
					<Calculator24Regular />
				</span>
			</div>

			<div className="calculation-loader-copy">
				<strong>Evaluating Plan...</strong>
				<span>Applying decision criteria</span>
			</div>
		</div>
	);
}
