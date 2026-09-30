import type { AssociateIdentityProps } from "../types/approval";

function getInitials(displayName: string): string {
	const nameParts = displayName.trim().split(/\s+/).filter(Boolean);

	if (nameParts.length === 0) {
		return "?";
	}

	if (nameParts.length === 1) {
		return nameParts[0].slice(0, 2).toUpperCase();
	}

	return `${nameParts[0][0]}${nameParts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function AssociateIdentity({
	displayName,
	badgePhoto,
}: AssociateIdentityProps) {
	return (
		<span className="associate-identity">
			<span className="associate-avatar" aria-hidden="true">
				<span className="associate-avatar-initials">
					{getInitials(displayName)}
				</span>
				{badgePhoto && (
					<img
						alt=""
						src={badgePhoto}
						onError={(event) => {
							event.currentTarget.hidden = true;
						}}
					/>
				)}
			</span>
			<span className="associate-identity-name">{displayName}</span>
		</span>
	);
}
