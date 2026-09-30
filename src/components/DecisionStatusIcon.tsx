import { CheckmarkCircle24Regular } from "@fluentui/react-icons/svg/checkmark-circle";
import { ErrorCircle24Regular } from "@fluentui/react-icons/svg/error-circle";
import { PersonClock24Regular } from "@fluentui/react-icons/svg/person-clock";
import type { DecisionStatusIconProps } from "../types/approval";

export function DecisionStatusIcon({ status }: DecisionStatusIconProps) {
	if (status === "approved") {
		return <CheckmarkCircle24Regular aria-hidden="true" />;
	}

	if (status === "manager_review") {
		return <PersonClock24Regular aria-hidden="true" />;
	}

	return <ErrorCircle24Regular aria-hidden="true" />;
}
