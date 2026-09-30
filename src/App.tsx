import { useEffect, useState } from "react";
import { API_ROUTES } from "./config/api";
import {
	getErrorMessage,
	readApiResponse,
	waitForMinimumDuration,
} from "./functions/helpers";
import { AppHeader } from "./components/AppHeader";
import { DecisionPanel } from "./components/DecisionPanel";
import { ReviewForm } from "./components/ReviewForm";
import { ManagerQueue } from "./components/ManagerQueue";
import { SubmissionsView } from "./components/SubmissionsView";
import type {
	AppView,
	ApprovalResponse,
	IdentityResponse,
	ReviewFormValues,
} from "./types/approval";

export default function App() {
	const [activeView, setActiveView] = useState<AppView>("new-review");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [calculationValues, setCalculationValues] =
		useState<ReviewFormValues | null>(null);
	const [result, setResult] = useState<ApprovalResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [userDisplayName, setUserDisplayName] = useState("Loading...");
	const [userBadgePhoto, setUserBadgePhoto] = useState<string | null>(null);
	const [isIdentityLoading, setIsIdentityLoading] = useState(true);
	const [showManagerQueue, setShowManagerQueue] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function loadIdentity() {
			try {
				const response = await fetch(API_ROUTES.identity, {
					headers: { Accept: "application/json" },
				});

				const body = await readApiResponse<IdentityResponse>(
					response,
					"Unable to load identity",
				);

				if (!cancelled) {
					setUserDisplayName(body.displayName);
					setUserBadgePhoto(body.badgePhoto);
					setShowManagerQueue(body.role === "manager");
				}
			} catch {
				if (!cancelled) {
					setUserDisplayName("Identity unavailable");
					setUserBadgePhoto(null);
					setShowManagerQueue(false);
				}
			} finally {
				if (!cancelled) {
					setIsIdentityLoading(false);
				}
			}
		}

		void loadIdentity();

		return () => {
			cancelled = true;
		};
	}, []);

	async function evaluatePlan(values: ReviewFormValues) {
		const calculationStartedAt = Date.now();

		setIsSubmitting(true);
		setCalculationValues(values);
		setError(null);
		setResult(null);

		try {
			const response = await fetch(API_ROUTES.approval, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(values),
			});

			const body = await readApiResponse<ApprovalResponse>(
				response,
				"Could not complete request",
			);

			await waitForMinimumDuration(calculationStartedAt, 2000);
			setResult(body);
		} catch (caughtError) {
			await waitForMinimumDuration(calculationStartedAt, 2000);
			setError(getErrorMessage(caughtError, "Could not complete request"));
		} finally {
			setIsSubmitting(false);
		}
	}

	function clearReview() {
		setCalculationValues(null);
		setResult(null);
		setError(null);
	}

	return (
		<div className="app-shell">
			<AppHeader
				activeView={activeView}
				isIdentityLoading={isIdentityLoading}
				userDisplayName={userDisplayName}
				userBadgePhoto={userBadgePhoto}
				showManagerQueue={showManagerQueue}
				onViewChange={setActiveView}
			/>

			<main className="app-main">
				{activeView === "new-review" && (
					<div className="review-workspace">
						<ReviewForm
							isSubmitting={isSubmitting}
							onClear={clearReview}
							onSubmit={evaluatePlan}
						/>
						<DecisionPanel
							calculationValues={calculationValues}
							error={error}
							isSubmitting={isSubmitting}
							result={result}
						/>
					</div>
				)}

				{activeView === "submissions" && <SubmissionsView />}
				{activeView === "manager-queue" && showManagerQueue && <ManagerQueue />}
			</main>
		</div>
	);
}
