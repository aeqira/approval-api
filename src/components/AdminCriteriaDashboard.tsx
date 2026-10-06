import { useEffect, useState, type FormEvent } from "react";
import { History24Regular } from "@fluentui/react-icons/svg/history";
import { Save24Regular } from "@fluentui/react-icons/svg/save";
import { Settings24Regular } from "@fluentui/react-icons/svg/settings";
import { API_ROUTES } from "../config/api";
import {
	criteriaToForm,
	formatSubmittedAt,
	getErrorMessage,
	readApiResponse,
} from "../functions/helpers";
import type {
	AdminCriteriaDashboardProps,
	ApprovalCriteria,
	ApprovalCriteriaHistoryResponse,
	ApprovalCriteriaResponse,
	CriteriaNumberField,
	UpdateApprovalCriteriaRequest,
} from "../types/approval";
import { LoadingIndicator } from "./LoadingIndicator";

const NUMBER_FIELDS: Array<{
	name: CriteriaNumberField;
	label: string;
	description: string;
	min: number;
	max: number;
}> = [
	{
		name: "maxRegularDefermentCount",
		label: "Maximum Regular Deferments",
		description: "Maximum lifetime count eligible for another deferment.",
		min: 0,
		max: 10,
	},
	{
		name: "defermentMonths",
		label: "Deferment Length",
		description: "Number of monthly payments included in a deferment.",
		min: 1,
		max: 12,
	},
	{
		name: "defermentDaysReduction",
		label: "Delinquency Days Removed",
		description: "Days removed from delinquency when a deferment applies.",
		min: 1,
		max: 365,
	},
	{
		name: "automaticApprovalMaxDays",
		label: "Automatic Approval Maximum Days",
		description:
			"Highest adjusted delinquency eligible for automatic approval.",
		min: 0,
		max: 3650,
	},
	{
		name: "denialDaysThreshold",
		label: "Denial Days Threshold",
		description: "Adjusted delinquency at or above this value is denied.",
		min: 1,
		max: 3650,
	},
	{
		name: "automaticApprovalMaxPayments",
		label: "Automatic Approval Maximum Payments",
		description: "Highest payment count eligible for automatic approval.",
		min: 1,
		max: 60,
	},
	{
		name: "maxPlanPayments",
		label: "Maximum Plan Payments",
		description: "Plans above this payment count are denied.",
		min: 2,
		max: 60,
	},
];

export function AdminCriteriaDashboard({
	onCriteriaUpdated,
}: AdminCriteriaDashboardProps) {
	const [criteria, setCriteria] = useState<ApprovalCriteria | null>(null);
	const [form, setForm] = useState<UpdateApprovalCriteriaRequest | null>(null);
	const [history, setHistory] = useState<ApprovalCriteria[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function loadDashboard() {
			try {
				const [criteriaResponse, historyResponse] = await Promise.all([
					fetch(API_ROUTES.adminCriteria, {
						headers: { Accept: "application/json" },
					}),
					fetch(API_ROUTES.adminCriteriaHistory, {
						headers: { Accept: "application/json" },
					}),
				]);

				const criteriaBody = await readApiResponse<ApprovalCriteriaResponse>(
					criteriaResponse,
					"Unable to load approval criteria",
				);

				const historyBody =
					await readApiResponse<ApprovalCriteriaHistoryResponse>(
						historyResponse,
						"Unable to load approval criteria history",
					);

				if (!cancelled) {
					setCriteria(criteriaBody.criteria);
					setForm(criteriaToForm(criteriaBody.criteria));
					setHistory(historyBody.versions);
				}
			} catch (caughtError) {
				if (!cancelled) {
					setError(
						getErrorMessage(caughtError, "Unable to load approval criteria"),
					);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		void loadDashboard();

		return () => {
			cancelled = true;
		};
	}, []);

	function updateNumber(field: CriteriaNumberField, value: string) {
		if (!form) {
			return;
		}

		setForm({
			...form,
			[field]: Number(value),
		});
	}

	async function saveCriteria(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!form) {
			return;
		}

		setIsSaving(true);
		setError(null);
		setSuccessMessage(null);

		try {
			const response = await fetch(API_ROUTES.adminCriteria, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(form),
			});

			const body = await readApiResponse<ApprovalCriteriaResponse>(
				response,
				"Unable to save approval criteria",
			);

			const historyResponse = await fetch(API_ROUTES.adminCriteriaHistory, {
				headers: { Accept: "application/json" },
			});

			const historyBody =
				await readApiResponse<ApprovalCriteriaHistoryResponse>(
					historyResponse,
					"Unable to reload approval criteria history",
				);

			setCriteria(body.criteria);
			setForm(criteriaToForm(body.criteria));
			setHistory(historyBody.versions);
			onCriteriaUpdated(body.criteria);
			setSuccessMessage(
				`Criteria version ${body.criteria.versionId} is now active.`,
			);
		} catch (caughtError) {
			setError(
				getErrorMessage(caughtError, "Unable to save approval criteria"),
			);
		} finally {
			setIsSaving(false);
		}
	}

	if (isLoading) {
		return (
			<section className="workspace-panel admin-criteria-dashboard">
				<LoadingIndicator label="Loading approval criteria" />
			</section>
		);
	}

	if (!form || !criteria) {
		return (
			<section className="workspace-panel admin-criteria-dashboard">
				<p className="form-error" role="alert">
					{error ?? "Approval criteria are unavailable."}
				</p>
			</section>
		);
	}

	return (
		<section className="workspace-panel admin-criteria-dashboard">
			<div className="panel-heading">
				<div>
					<h2 className="heading-with-icon">
						<Settings24Regular aria-hidden="true" />
						Approval Criteria
					</h2>
					<p>Update the rules used for new payment-plan decisions.</p>
				</div>

				<span className="criteria-version">
					Active version {criteria.versionId}
				</span>
			</div>

			<div className="admin-criteria-layout">
				<form className="criteria-form" onSubmit={saveCriteria}>
					<div className="criteria-field-grid">
						{NUMBER_FIELDS.map((field) => (
							<label className="criteria-field" key={field.name}>
								<span>{field.label}</span>
								<input
									min={field.min}
									max={field.max}
									required
									type="number"
									value={form[field.name]}
									onChange={(event) =>
										updateNumber(field.name, event.target.value)
									}
								/>
								<small>{field.description}</small>
							</label>
						))}
					</div>

					<label className="criteria-field criteria-reason">
						<span>Reason for Change</span>
						<textarea
							required
							maxLength={1000}
							placeholder="Explain why these criteria are changing"
							value={form.changeReason}
							onChange={(event) =>
								setForm({
									...form,
									changeReason: event.target.value,
								})
							}
						/>
					</label>

					{error && (
						<p className="form-error" role="alert">
							{error}
						</p>
					)}

					{successMessage && (
						<p className="form-success" role="status">
							{successMessage}
						</p>
					)}

					<button className="primary-button" disabled={isSaving} type="submit">
						<Save24Regular aria-hidden="true" />
						{isSaving ? "Saving Criteria..." : "Save New Version"}
					</button>
				</form>

				<aside className="criteria-history">
					<h3 className="heading-with-icon">
						<History24Regular aria-hidden="true" />
						Change History
					</h3>

					<ul className="criteria-history-list">
						{history.map((version) => (
							<li key={version.versionId}>
								<div>
									<strong>Version {version.versionId}</strong>
									<span>{formatSubmittedAt(version.changedAt)}</span>
								</div>
								<p>{version.changeReason ?? "No change reason recorded."}</p>
								<small>{version.changedBy ?? "Initial system version"}</small>
							</li>
						))}
					</ul>
				</aside>
			</div>
		</section>
	);
}
