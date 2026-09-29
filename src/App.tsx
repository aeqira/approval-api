import { useEffect, useState } from "react";
import { API_ROUTES } from "./config/api";
import { AppHeader } from "./components/AppHeader";
import { DecisionPanel, type DecisionResult } from "./components/DecisionPanel";
import { ReviewForm, type ReviewFormValues } from "./components/ReviewForm";
import { ManagerQueue } from "./components/ManagerQueue";
import type { AppView } from "./types/approval";
import type { UserRole } from "./services/user-storage";

interface IdentityResponse {
	email: string;
	role: UserRole;
}

interface ErrorResponse {
	error: string;
}

export default function App() {
	const [activeView, setActiveView] = useState<AppView>("new-review");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<DecisionResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [userEmail, setUserEmail] = useState("Loading...");
	const [showManagerQueue, setShowManagerQueue] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function loadIdentity() {
			try {
				const response = await fetch(API_ROUTES.identity, {
					headers: { Accept: "application/json" },
				});

				const body = (await response.json()) as
					| IdentityResponse
					| ErrorResponse;

				if (!response.ok || "error" in body) {
					throw new Error(
						"error" in body ? body.error : "Unable to load identity",
					);
				}

				if (!cancelled) {
					setUserEmail(body.email);
					setShowManagerQueue(body.role === "manager");
				}
			} catch {
				if (!cancelled) {
					setUserEmail("Identity unavailable");
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

			const body = (await response.json()) as DecisionResult | ErrorResponse;

			if (!response.ok || "error" in body) {
				throw new Error(
					"error" in body ? body.error : "Could not complete request",
				);
			}

			setResult(body);
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Could not complete request",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="app-shell">
			<AppHeader
				activeView={activeView}
				userEmail={userEmail}
				showManagerQueue={showManagerQueue}
				onViewChange={setActiveView}
			/>

			<main className="app-main">
				{activeView === "new-review" && (
					<div className="review-workspace">
						<ReviewForm isSubmitting={isSubmitting} onSubmit={evaluatePlan} />
						<DecisionPanel
							error={error}
							isSubmitting={isSubmitting}
							result={result}
						/>
					</div>
				)}

				{activeView === "manager-queue" && showManagerQueue && <ManagerQueue />}
			</main>
		</div>
	);
}
