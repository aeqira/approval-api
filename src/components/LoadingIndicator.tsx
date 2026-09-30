import { ArrowSync24Regular } from "@fluentui/react-icons/svg/arrow-sync";
import type { LoadingIndicatorProps } from "../types/approval";

export function LoadingIndicator({
	label,
	detail,
	compact = false,
}: LoadingIndicatorProps) {
	return (
		<div
			aria-live="polite"
			className={compact ? "loading-indicator loading-indicator--compact" : "loading-indicator"}
			role="status"
		>
			<span className="loading-indicator-icon" aria-hidden="true">
				<ArrowSync24Regular />
			</span>
			<span className="loading-indicator-copy">
				<strong>{label}</strong>
				{detail && <span>{detail}</span>}
			</span>
		</div>
	);
}
