import { useEffect, useState } from "react";
import { API_ROUTES } from "./config/api";
import { getErrorMessage, readApiResponse } from "./functions/helpers";
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
	const [result, setResult] = useState<ApprovalResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [userDisplayName, setUserDisplayName] = useState("Loading...");
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
					setShowManagerQueue(body.role === "manager");
				}
			} catch {
				if (!cancelled) {
					setUserDisplayName("Identity unavailable");
					setShowManagerQueue(false);
				}
			}
		}

		void loadIdentity();

		return () => {
			cancelled = true;
		};
	}, []);

	async function evaluatePlan(values: ReviewFormValues) {
		setIsSubmitting(true);
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

			setResult(body);
		} catch (caughtError) {
			setError(getErrorMessage(caughtError, "Could not complete request"));
		} finally {
			setIsSubmitting(false);
		}
	}

	function clearReview() {
		setResult(null);
		setError(null);
	}

	return (
		<div className="app-shell">
			<AppHeader
				activeView={activeView}
				userDisplayName={userDisplayName}
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
