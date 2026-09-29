import { useState } from "react";
import { API_ROUTES } from "../config/api";
import type {
	ManagerDecisionResponse,
	ManagerDecisionStatus,
} from "../types/approval";

interface ErrorResponse {
	error: string;
}

interface ManagerDecisionControlProps {
	reviewId: string;
	onResolved: (decision: ManagerDecisionResponse) => void;
}

export function ManagerDecisionControls({
	reviewId,
	onResolved,
}: ManagerDecisionControlProps) {
	const [reason, setReason] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submitDecision(status: ManagerDecisionStatus) {
		const managerReason = reason.trim();

		if (!managerReason) {
			setError("Enter a decision reason");
			return;
		}

		setIsSubmitting(true);
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

			const body = (await response.json()) as
				| ManagerDecisionResponse
				| ErrorResponse;

			if (!response.ok || "error" in body) {
				throw new Error(
					"error" in body ? body.error : "Unable to save manager decision",
				);
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	const reasonId = `manager-reason-${reviewId}`;

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
					{isSubmitting ? "Saving..." : "Approve"}
				</button>

				<button
					className="manager-deny-button"
					disabled={isSubmitting}
					type="button"
					onClick={() => void submitDecision("denied")}
				>
					{isSubmitting ? "Saving..." : "Deny"}
				</button>
			</div>
		</div>
	);
}
