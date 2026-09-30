import { ArrowClockwise24Regular } from "@fluentui/react-icons/svg/arrow-clockwise";
import { useCallback, useEffect, useRef, useState } from "react";
import { API_ROUTES } from "../config/api";
import {
	formatCurrency,
	getErrorMessage,
	readApiResponse,
} from "../functions/helpers";
import { ManagerDecisionControls } from "./ManagerDecisionControls";
import { LoadingIndicator } from "./LoadingIndicator";
import { DecisionStatusIcon } from "./DecisionStatusIcon";
import { AssociateIdentity } from "./AssociateIdentity";
import type { ManagerReview, ManagerReviewsResponse } from "../types/approval";

export function ManagerQueue() {
	const [reviews, setReviews] = useState<ManagerReview[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const activeRequest = useRef<AbortController | null>(null);

	function removeResolvedReview(reviewId: string) {
		setReviews((currentReviews) =>
			currentReviews.filter((review) => review.reviewId !== reviewId),
		);
	}

	const loadReviews = useCallback(async (showLoading = true) => {
		activeRequest.current?.abort();
		const requestController = new AbortController();
		activeRequest.current = requestController;

		if (showLoading) {
			setIsLoading(true);
		}

		setError(null);

		try {
			const response = await fetch(API_ROUTES.managerReviews, {
				headers: {
					Accept: "application/json",
				},
				signal: requestController.signal,
			});

			const body = await readApiResponse<ManagerReviewsResponse>(
				response,
				"Unable to load Reviews",
			);

			setReviews(body.reviews);
		} catch (caughtError) {
			if (requestController.signal.aborted) {
				return;
			}

			setError(
				getErrorMessage(caughtError, "Unable to load Reviews"),
			);
		} finally {
			if (activeRequest.current === requestController) {
				activeRequest.current = null;
			}

			if (showLoading && !requestController.signal.aborted) {
				setIsLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		void loadReviews();

		const intervalId = window.setInterval(() => {
			if (!document.hidden) {
				void loadReviews(false);
			}
		}, 5000);
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				void loadReviews(false);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			activeRequest.current?.abort();
			window.clearInterval(intervalId);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [loadReviews]);

	return (
		<section className="workspace-panel manager-queue">
			<div className="panel-heading manager-queue-heading">
				<div>
					<h2>Review Queue</h2>
					<p>Review payment plans requiring approval</p>
				</div>

				<button
					className="secondary-button"
					disabled={isLoading}
					type="button"
					onClick={() => void loadReviews()}
				>
					<ArrowClockwise24Regular
						aria-hidden="true"
						className={isLoading ? "spinning-icon" : undefined}
					/>
					Refresh
				</button>
			</div>

			{isLoading && (
				<div className="result-state">
					<LoadingIndicator label="Loading Reviews..." />
				</div>
			)}

			{!isLoading && error && (
				<div className="result-state result-state--error" role="alert">
					<h3>Unable to Load Reviews</h3>
					<p>{error}</p>
				</div>
			)}

			{!isLoading && !error && reviews.length === 0 && (
				<div className="result-state">
					<h3>No Pending Reviews</h3>
					<p>Payment plans requiring review will appear here</p>
				</div>
			)}

			{!isLoading && !error && reviews.length > 0 && (
				<div className="manager-review-list">
					{reviews.map((review) => (
						<article className="manager-review-card" key={review.reviewId}>
							<div className="manager-review-heading">
								<div>
									<h3>Member {review.memberNumber}</h3>
									<p>
										<AssociateIdentity
											badgePhoto={review.associateBadgePhoto}
											displayName={review.associateDisplayName}
										/>
									</p>
								</div>

								<span className="decision-status decision-status--manager-review">
									<DecisionStatusIcon status="manager_review" />
									Review
								</span>
							</div>

							<dl className="decision-summary">
								<div>
									<dt>Adjusted Days Delinquent</dt>
									<dd>{review.adjustedDaysPastDue}</dd>
								</div>

								<div>
									<dt>Adjusted Delinquent Balance</dt>
									<dd>{formatCurrency(review.adjustedPastDueBalance)}</dd>
								</div>

								<div>
									<dt>Plan Payment</dt>
									<dd>{formatCurrency(review.planPayment)}</dd>
								</div>

								<div>
									<dt>Payment Count</dt>
									<dd>{review.numberOfPayments}</dd>
								</div>

								<div className="manager-review-reasons">
									<dt>Review Reasons</dt>
									<dd>
										{review.regularDefermentApplied && (
											<p>
												{review.defermentMonths}-month deferment applied:{" "}
												{formatCurrency(review.deferredAmount)}
											</p>
										)}
										<ul>
											{review.reasons.map((reason) => (
												<li key={reason}>{reason}</li>
											))}
										</ul>
									</dd>
								</div>

								<div className="manager-decision-card">
									<dt>Manager Decision</dt>
									<dd>
										<ManagerDecisionControls
											reviewId={review.reviewId}
											onResolved={(decision) =>
												removeResolvedReview(decision.reviewId)
											}
										/>
									</dd>
								</div>
							</dl>
						</article>
					))}
				</div>
			)}
		</section>
	);
}
