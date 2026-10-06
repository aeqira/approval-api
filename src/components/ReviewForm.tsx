import { ArrowSync24Regular } from "@fluentui/react-icons/svg/arrow-sync";
import { Calculator24Regular } from "@fluentui/react-icons/svg/calculator";
import { CalendarArrowCounterclockwise24Regular } from "@fluentui/react-icons/svg/calendar-arrow-counterclockwise";
import { DocumentBulletList24Regular } from "@fluentui/react-icons/svg/document-bullet-list";
import { Eraser24Regular } from "@fluentui/react-icons/svg/eraser";
import { ErrorCircle24Regular } from "@fluentui/react-icons/svg/error-circle";
import { useState, type FormEvent } from "react";
import { validateApprovalRequest } from "../schemas/approval";
import type {
	ApprovalFormField,
	ApprovalValidationErrors,
	ReviewFormProps,
	ReviewFormValues,
} from "../types/approval";

export function ReviewForm({
	isSubmitting,
	maxRegularDefermentCount,
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
	const [errors, setErrors] = useState<ApprovalValidationErrors>({});

	function clearFieldError(field: ApprovalFormField) {
		setErrors((current) => {
			if (!current[field]) {
				return current;
			}

			const nextErrors = { ...current };
			delete nextErrors[field];
			return nextErrors;
		});
	}

	function getValues(): ReviewFormValues {
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

		return {
			memberNumber: memberNumber.trim(),
			pastDueDate,
			pastDueBalance: Number(pastDueBalance),
			monthlyPayment: Number(monthlyPayment),
			regularDefermentCount: Number(regularDefermentCount),
			paymentChoice,
		};
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const values = getValues();
		const validationErrors = validateApprovalRequest(
			values,
			maxRegularDefermentCount,
		);

		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		setErrors({});
		await onSubmit(values);
	}

	function handleClear() {
		setMemberNumber("");
		setPastDueDate("");
		setPastDueBalance("");
		setMonthlyPayment("");
		setRegularDefermentCount("0");
		setPaymentType("minimum_plus_extra");
		setPaymentAmount("");
		setErrors({});
		onClear();
	}

	return (
		<section className="workspace-panel">
			<div className="panel-heading">
				<h2 className="heading-with-icon">
					<DocumentBulletList24Regular aria-hidden="true" />
					Loan Information
				</h2>
				<p>
					Enter the account details and select a payment option to evaluate a
					plan
				</p>
			</div>

			<form className="review-form" noValidate onSubmit={handleSubmit}>
				{Object.keys(errors).length > 0 && (
					<div className="form-validation-summary" role="alert">
						<ErrorCircle24Regular aria-hidden="true" />
						<span>
							Correct the highlighted fields before evaluating the plan.
						</span>
					</div>
				)}

				<label className="form-field">
					<span>Member Number</span>
					<input
						aria-describedby={
							errors.memberNumber ? "member-number-error" : undefined
						}
						aria-invalid={Boolean(errors.memberNumber)}
						autoComplete="off"
						value={memberNumber}
						onChange={(event) => {
							setMemberNumber(event.target.value);
							clearFieldError("memberNumber");
						}}
					/>
					{errors.memberNumber && (
						<small className="form-field-error" id="member-number-error">
							{errors.memberNumber}
						</small>
					)}
				</label>

				<label className="form-field">
					<span>Past Due Date</span>
					<input
						aria-describedby={
							errors.pastDueDate ? "past-due-date-error" : undefined
						}
						aria-invalid={Boolean(errors.pastDueDate)}
						type="date"
						value={pastDueDate}
						onChange={(event) => {
							setPastDueDate(event.target.value);
							clearFieldError("pastDueDate");
						}}
					/>
					{errors.pastDueDate && (
						<small className="form-field-error" id="past-due-date-error">
							{errors.pastDueDate}
						</small>
					)}
				</label>

				<label className="form-field">
					<span>Delinquent Balance</span>
					<div className="money-input">
						<span aria-hidden="true">$</span>
						<input
							aria-describedby={
								errors.pastDueBalance ? "past-due-balance-error" : undefined
							}
							aria-invalid={Boolean(errors.pastDueBalance)}
							min="0.01"
							step="0.01"
							type="number"
							value={pastDueBalance}
							onChange={(event) => {
								setPastDueBalance(event.target.value);
								clearFieldError("pastDueBalance");
							}}
						/>
					</div>
					{errors.pastDueBalance && (
						<small className="form-field-error" id="past-due-balance-error">
							{errors.pastDueBalance}
						</small>
					)}
				</label>

				<label className="form-field">
					<span>Monthly Payment</span>
					<div className="money-input">
						<span aria-hidden="true">$</span>
						<input
							aria-describedby={
								errors.monthlyPayment ? "monthly-payment-error" : undefined
							}
							aria-invalid={Boolean(errors.monthlyPayment)}
							min="0.01"
							step="0.01"
							type="number"
							value={monthlyPayment}
							onChange={(event) => {
								setMonthlyPayment(event.target.value);
								clearFieldError("monthlyPayment");
							}}
						/>
					</div>
					{errors.monthlyPayment && (
						<small className="form-field-error" id="monthly-payment-error">
							{errors.monthlyPayment}
						</small>
					)}
				</label>

				<label className="form-field">
					<span className="form-field-label-with-icon">
						<CalendarArrowCounterclockwise24Regular aria-hidden="true" />
						Deferments Used
					</span>
					<input
						aria-describedby={
							errors.regularDefermentCount ? "deferment-count-error" : undefined
						}
						aria-invalid={Boolean(errors.regularDefermentCount)}
						min="0"
						max={maxRegularDefermentCount}
						step="1"
						type="number"
						value={regularDefermentCount}
						onChange={(event) => {
							setRegularDefermentCount(event.target.value);
							clearFieldError("regularDefermentCount");
						}}
					/>
					{errors.regularDefermentCount && (
						<small className="form-field-error" id="deferment-count-error">
							{errors.regularDefermentCount}
						</small>
					)}
				</label>

				<fieldset className="payment-choice">
					<legend>Payment Choice</legend>

					<label className="choice-option">
						<input
							checked={paymentType === "minimum_plus_extra"}
							name="paymentType"
							type="radio"
							onChange={() => {
								setPaymentType("minimum_plus_extra");
								clearFieldError("paymentAmount");
							}}
						/>
						<span>Minimum Plus Extra</span>
					</label>

					<label className="choice-option">
						<input
							checked={paymentType === "affordable_payment"}
							name="paymentType"
							type="radio"
							onChange={() => {
								setPaymentType("affordable_payment");
								clearFieldError("paymentAmount");
							}}
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
							aria-describedby={
								errors.paymentAmount ? "payment-amount-error" : undefined
							}
							aria-invalid={Boolean(errors.paymentAmount)}
							min="0.01"
							step="0.01"
							type="number"
							value={paymentAmount}
							onChange={(event) => {
								setPaymentAmount(event.target.value);
								clearFieldError("paymentAmount");
							}}
						/>
					</div>
					{errors.paymentAmount && (
						<small className="form-field-error" id="payment-amount-error">
							{errors.paymentAmount}
						</small>
					)}
				</label>

				<div className="review-form-actions">
					<button
						className="secondary-button"
						disabled={isSubmitting}
						type="button"
						onClick={handleClear}
					>
						<Eraser24Regular aria-hidden="true" />
						Clear Form
					</button>

					<button
						className="primary-button"
						disabled={isSubmitting}
						type="submit"
					>
						{isSubmitting ? (
							<>
								<ArrowSync24Regular
									aria-hidden="true"
									className="spinning-icon"
								/>
								Evaluating...
							</>
						) : (
							<>
								<Calculator24Regular aria-hidden="true" />
								Evaluate Plan
							</>
						)}
					</button>
				</div>
			</form>
		</section>
	);
}
