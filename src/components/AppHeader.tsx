import type { AppHeaderProps } from "../types/approval";

export function AppHeader({
	activeView,
	userDisplayName,
	showManagerQueue,
	onViewChange,
}: AppHeaderProps) {
	return (
		<header className="app-header">
			<div className="app-header-top">
				<h1 className="app-header-title">Payment Plan Review</h1>

				<span className="app-header-email">{userDisplayName}</span>
			</div>

			<nav className="app-nav" aria-label="Primary navigation">
				<button
					className={
						activeView === "new-review"
							? "app-nav-item app-nav-item--active"
							: "app-nav-item"
					}
					type="button"
					onClick={() => onViewChange("new-review")}
				>
					New Review
				</button>

				<button
					className={
						activeView === "submissions"
							? "app-nav-item app-nav-item--active"
							: "app-nav-item"
					}
					type="button"
					onClick={() => onViewChange("submissions")}
				>
					All Submissions
				</button>

				{showManagerQueue && (
					<button
						className={
							activeView === "manager-queue"
								? "app-nav-item app-nav-item--active"
								: "app-nav-item"
						}
						type="button"
						onClick={() => onViewChange("manager-queue")}
					>
						Manager Queue
					</button>
				)}
			</nav>
		</header>
	);
}
