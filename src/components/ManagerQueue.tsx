import { ArrowClockwise24Regular } from "@fluentui/react-icons/svg/arrow-clockwise";
import { CalendarClock24Regular } from "@fluentui/react-icons/svg/calendar-clock";
import { CheckmarkCircle48Filled } from "@fluentui/react-icons/svg/checkmark-circle";
import { DismissCircle48Filled } from "@fluentui/react-icons/svg/dismiss-circle";
import { DocumentBulletList24Regular } from "@fluentui/react-icons/svg/document-bullet-list";
import { Money24Regular } from "@fluentui/react-icons/svg/money";
import { NumberSymbol24Regular } from "@fluentui/react-icons/svg/number-symbol";
import { Payment24Regular } from "@fluentui/react-icons/svg/payment";
import { People24Regular } from "@fluentui/react-icons/svg/people";
import { PersonFeedback24Regular } from "@fluentui/react-icons/svg/person-feedback";
import { Person24Regular } from "@fluentui/react-icons/svg/person";
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
import type {
	ManagerDecisionResponse,
	ManagerDecisionStatus,
	ManagerReview,
	ManagerReviewsResponse,
} from "../types/approval";

export function ManagerQueue() {
	const [reviews, setReviews] = useState<ManagerReview[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [resolvedReviews, setResolvedReviews] = useState<
		Record<string, ManagerDecisionStatus>
	>({});
	const activeRequest = useRef<AbortController | null>(null);
	const resolutionTimers = useRef<Set<number>>(new Set());
	const resolvedReviewIds = useRef<Set<string>>(new Set());

	function removeResolvedReview(reviewId: string) {
		setReviews((currentReviews) =>
			currentReviews.filter((review) => review.reviewId !== reviewId),
		);
	}

	function handleResolvedReview(decision: ManagerDecisionResponse) {
		resolvedReviewIds.current.add(decision.reviewId);
		setResolvedReviews((current) => ({
			...current,
			[decision.reviewId]: decision.status,
		}));

		const timerId = window.setTimeout(() => {
			removeResolvedReview(decision.reviewId);
			setResolvedReviews((current) => {
				const next = { ...current };
				delete next[decision.reviewId];
				return next;
			});
			resolvedReviewIds.current.delete(decision.reviewId);
			resolutionTimers.current.delete(timerId);
		}, 1100);

		resolutionTimers.current.add(timerId);
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

			setReviews((currentReviews) => {
				const resolvingReviews = currentReviews.filter((review) =>
					resolvedReviewIds.current.has(review.reviewId),
				);
				const resolvingIds = new Set(
					resolvingReviews.map((review) => review.reviewId),
				);

				return [
					...resolvingReviews,
					...body.reviews.filter(
						(review) => !resolvingIds.has(review.reviewId),
					),
				];
			});
		} catch (caughtError) {
			if (requestController.signal.aborted) {
				return;
			}

			setError(getErrorMessage(caughtError, "Unable to load Reviews"));
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
			for (const timerId of resolutionTimers.current) {
				window.clearTimeout(timerId);
			}
			resolutionTimers.current.clear();
			resolvedReviewIds.current.clear();
			window.clearInterval(intervalId);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [loadReviews]);

	return (
		<section className="workspace-panel manager-queue">
			<div className="panel-heading manager-queue-heading">
				<div>
					<h2 className="heading-with-icon">
						<People24Regular aria-hidden="true" />
						Review Queue
					</h2>
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
					{reviews.map((review) => {
						const resolvedStatus = resolvedReviews[review.reviewId];

						return (
							<article
								className={`manager-review-card${resolvedStatus ? ` manager-review-card--resolved manager-review-card--${resolvedStatus}` : ""}`}
								key={review.reviewId}
							>
								{resolvedStatus && (
									<div className="manager-resolution-overlay" role="status">
										{resolvedStatus === "approved" ? (
											<CheckmarkCircle48Filled aria-hidden="true" />
										) : (
											<DismissCircle48Filled aria-hidden="true" />
										)}
										<strong>
											{resolvedStatus === "approved" ? "Approved" : "Denied"}
										</strong>
									</div>
								)}
								<div className="manager-review-heading">
									<div>
										<h3 className="heading-with-icon">
											<Person24Regular aria-hidden="true" />
											Member {review.memberNumber}
										</h3>
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
										<dt>
											<CalendarClock24Regular aria-hidden="true" />
											Adjusted Days Delinquent
										</dt>
										<dd>{review.adjustedDaysPastDue}</dd>
									</div>

									<div>
										<dt>
											<Money24Regular aria-hidden="true" />
											Adjusted Delinquent Balance
										</dt>
										<dd>{formatCurrency(review.adjustedPastDueBalance)}</dd>
									</div>

									<div>
										<dt>
											<Payment24Regular aria-hidden="true" />
											Plan Payment
										</dt>
										<dd>{formatCurrency(review.planPayment)}</dd>
									</div>

									<div>
										<dt>
											<NumberSymbol24Regular aria-hidden="true" />
											Payment Count
										</dt>
										<dd>{review.numberOfPayments}</dd>
									</div>

									<div className="manager-review-reasons">
										<dt>
											<DocumentBulletList24Regular aria-hidden="true" />
											Review Reasons
										</dt>
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
										<dt>
											<PersonFeedback24Regular aria-hidden="true" />
											Manager Decision
										</dt>
										<dd>
											<ManagerDecisionControls
												reviewId={review.reviewId}
												onResolved={handleResolvedReview}
											/>
										</dd>
									</div>
								</dl>
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
}
