import { useState, type FormEvent } from "react";

export interface ReviewFormValues {
	memberNumber: string;
	pastDueDate: string;
	pastDueBalance: number;
	monthlyPayment: number;
	regularDefermentCount: number;
	paymentChoice:
		| {
				type: "minimum_plus_extra";
				extraAmount: number;
		  }
		| {
				type: "affordable_payment";
				affordablePayment: number;
		  };
}

interface ReviewFormProps {
	isSubmitting: boolean;
	onSubmit: (values: ReviewFormValues) => Promise<void>;
	onClear: () => void;
}

export function ReviewForm({
	isSubmitting,
	onSubmit,
	onClear,
}: ReviewFormProps) {
	const [memberNumber, setMemberNumber] = useState("");
	const [pastDueDate, setPastDueDate] = useState("");
	const [pastDueBalance, setPastDueBalance] = useState("");
	const [monthlyPayment, setMonthlyPayment] = useState("");
	const [regularDefermentCount, setRegularDefermentCount] = useState("0");
	const [paymentType, setPaymentType] = useState<
		"minimum_plus_extra" | "affordable_payment"
	>("minimum_plus_extra");
	const [paymentAmount, setPaymentAmount] = useState("");

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const paymentChoice =
			paymentType === "minimum_plus_extra"
				? {
						type: paymentType,
						extraAmount: Number(paymentAmount),
					}
				: {
						type: paymentType,
						affordablePayment: Number(paymentAmount),
					};

		await onSubmit({
			memberNumber: memberNumber.trim(),
			pastDueDate,
			pastDueBalance: Number(pastDueBalance),
			monthlyPayment: Number(monthlyPayment),
			regularDefermentCount: Number(regularDefermentCount),
			paymentChoice,
		});
	}

	function handleClear() {
		setMemberNumber("");
		setPastDueDate("");
		setPastDueBalance("");
		setMonthlyPayment("");
		setRegularDefermentCount("0");
		setPaymentType("minimum_plus_extra");
		setPaymentAmount("");
		onClear();
	}

	return (
		<section className="workspace-panel">
			<div className="panel-heading">
				<h2>Loan Information</h2>
				<p>
					Enter the account details and select a payment option to evaluate a
					plan
				</p>
			</div>

			<form className="review-form" onSubmit={handleSubmit}>
				<label className="form-field">
					<span>Member Number</span>
					<input
						required
						autoComplete="off"
						value={memberNumber}
						onChange={(event) => setMemberNumber(event.target.value)}
					/>
				</label>

				<label className="form-field">
					<span>Past Due Date</span>
					<input
						required
						type="date"
						value={pastDueDate}
						onChange={(event) => setPastDueDate(event.target.value)}
					/>
				</label>

				<label className="form-field">
					<span>Delinquent Balance</span>
					<div className="money-input">
						<span aria-hidden="true">$</span>
						<input
							required
							min="0.01"
							step="0.01"
							type="number"
							value={pastDueBalance}
							onChange={(event) => setPastDueBalance(event.target.value)}
						/>
					</div>
				</label>

				<label className="form-field">
					<span>Monthly Payment</span>
					<div className="money-input">
						<span aria-hidden="true">$</span>
						<input
							required
							min="0.01"
							step="0.01"
							type="number"
							value={monthlyPayment}
							onChange={(event) => setMonthlyPayment(event.target.value)}
						/>
					</div>
				</label>

				<label className="form-field">
					<span>Deferments Used</span>
					<input
						required
						min="0"
						step="1"
						type="number"
						value={regularDefermentCount}
						onChange={(event) => setRegularDefermentCount(event.target.value)}
					/>
				</label>

				<fieldset className="payment-choice">
					<legend>Payment Choice</legend>

					<label className="choice-option">
						<input
							checked={paymentType === "minimum_plus_extra"}
							name="paymentType"
							type="radio"
							onChange={() => setPaymentType("minimum_plus_extra")}
						/>
						<span>Minimum Plus Extra</span>
					</label>

					<label className="choice-option">
						<input
							checked={paymentType === "affordable_payment"}
							name="paymentType"
							type="radio"
							onChange={() => setPaymentType("affordable_payment")}
						/>
						<span>Affordable Payment</span>
					</label>
				</fieldset>

				<label className="form-field">
					<span>
						{paymentType === "minimum_plus_extra"
							? "Extra Amount"
							: "Affordable Payment"}
					</span>

					<div className="money-input">
						<span aria-hidden="true">$</span>
						<input
							required
							min="0.01"
							step="0.01"
							type="number"
							value={paymentAmount}
							onChange={(event) => setPaymentAmount(event.target.value)}
						/>
					</div>
				</label>

				<div className="review-form-actions">
					<button
						className="secondary-button"
						disabled={isSubmitting}
						type="button"
						onClick={handleClear}
					>
						Clear Form
					</button>

					<button
						className="primary-button"
						disabled={isSubmitting}
						type="submit"
					>
						{isSubmitting ? "Evaluating..." : "Evaluate Plan"}
					</button>
				</div>
			</form>
		</section>
	);
}
