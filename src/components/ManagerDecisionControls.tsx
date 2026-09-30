import { ArrowSync24Regular } from "@fluentui/react-icons/svg/arrow-sync";
import { Checkmark24Regular } from "@fluentui/react-icons/svg/checkmark";
import { DismissCircle24Regular } from "@fluentui/react-icons/svg/dismiss-circle";
import { useState } from "react";
import { API_ROUTES } from "../config/api";
import { getErrorMessage, readApiResponse } from "../functions/helpers";
import type {
	ManagerDecisionControlProps,
	ManagerDecisionResponse,
	ManagerDecisionStatus,
} from "../types/approval";

export function ManagerDecisionControls({
	reviewId,
	onResolved,
}: ManagerDecisionControlProps) {
	const [reason, setReason] = useState("");
	const [pendingDecision, setPendingDecision] =
		useState<ManagerDecisionStatus | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function submitDecision(status: ManagerDecisionStatus) {
		const managerReason = reason.trim();

		if (!managerReason) {
			setError("Enter a decision reason");
			return;
		}

		setPendingDecision(status);
		setError(null);

		try {
			const response = await fetch(API_ROUTES.managerReview(reviewId), {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					status,
					reason: managerReason,
				}),
			});

			const body = await readApiResponse<ManagerDecisionResponse>(
				response,
				"Unable to save manager decision",
			);

			onResolved(body);
		} catch (caughtError) {
			setError(
				getErrorMessage(caughtError, "Unable to save manager decision"),
			);
		} finally {
			setPendingDecision(null);
		}
	}

	const reasonId = `manager-reason-${reviewId}`;
	const isSubmitting = pendingDecision !== null;

	return (
		<div className="manager-decision-controls">
			<label htmlFor={reasonId}>Reason</label>
			<textarea
				id={reasonId}
				maxLength={1000}
				placeholder="Provide reason for decision"
				rows={3}
				value={reason}
				onChange={(event) => setReason(event.target.value)}
			/>
			{error && (
				<p className="manager-decision-error" role="alert">
					{error}
				</p>
			)}
			<div className="manager-decision-actions">
				<button
					className="manager-approve-button"
					disabled={isSubmitting}
					type="button"
					onClick={() => void submitDecision("approved")}
				>
					{pendingDecision === "approved" ? (
						<ArrowSync24Regular aria-hidden="true" className="spinning-icon" />
					) : (
						<Checkmark24Regular aria-hidden="true" />
					)}
					{pendingDecision === "approved" ? "Saving..." : "Approve"}
				</button>

				<button
					className="manager-deny-button"
					disabled={isSubmitting}
					type="button"
					onClick={() => void submitDecision("denied")}
				>
					{pendingDecision === "denied" ? (
						<ArrowSync24Regular aria-hidden="true" className="spinning-icon" />
					) : (
						<DismissCircle24Regular aria-hidden="true" />
					)}
					{pendingDecision === "denied" ? "Saving..." : "Deny"}
				</button>
			</div>
		</div>
	);
}
