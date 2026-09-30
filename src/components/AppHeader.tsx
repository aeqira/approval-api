import { AddSquare24Regular } from "@fluentui/react-icons/svg/add-square";
import { ArrowSync24Regular } from "@fluentui/react-icons/svg/arrow-sync";
import { ClipboardTaskListLtr24Regular } from "@fluentui/react-icons/svg/clipboard-task-list-ltr";
import { People24Regular } from "@fluentui/react-icons/svg/people";
import type { AppHeaderProps } from "../types/approval";
import { AssociateIdentity } from "./AssociateIdentity";

export function AppHeader({
	activeView,
	isIdentityLoading,
	userDisplayName,
	userBadgePhoto,
	showManagerQueue,
	onViewChange,
}: AppHeaderProps) {
	return (
		<header className="app-header">
			<div className="app-header-top">
				<h1 className="app-header-title">Payment Plan Review</h1>

				<span className="app-header-email">
					{isIdentityLoading ? (
						<ArrowSync24Regular
							aria-hidden="true"
							className="spinning-icon"
						/>
					) : (
						<AssociateIdentity
							badgePhoto={userBadgePhoto}
							displayName={userDisplayName}
						/>
					)}
					{isIdentityLoading && userDisplayName}
				</span>
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
					<AddSquare24Regular aria-hidden="true" />
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
					<ClipboardTaskListLtr24Regular aria-hidden="true" />
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
						<People24Regular aria-hidden="true" />
						Manager Queue
					</button>
				)}
			</nav>
		</header>
	);
}
