import type { AppView } from '../types/approval';

interface AppHeaderProps {
	activeView: AppView;
	userEmail: string;
	showManagerQueue: boolean;
	onViewChange: (view: AppView) => void;
}

export function AppHeader({ activeView, userEmail, showManagerQueue, onViewChange }: AppHeaderProps) {
	return (
		<header className="app-header">
			<div className="app-header-top">
				<h1 className="app-header-title">Payment Plan Review</h1>

				<span className="app-header-email">{userEmail}</span>
			</div>

			<nav className="app-nav" aria-label="Primary navigation">
				<button
					className={activeView === 'new-review' ? 'app-nav-item app-nav-item--active' : 'app-nav-item'}
					type="button"
					onClick={() => onViewChange('new-review')}
				>
					New Review
				</button>

				{showManagerQueue && (
					<button
						className={activeView === 'manager-queue' ? 'app-nav-item app-nav-item--active' : 'app-nav-item'}
						type="button"
						onClick={() => onViewChange('manager-queue')}
					>
						Manager Queue
					</button>
				)}
			</nav>
		</header>
	);
}
