import { getInitials } from "../functions/helpers";
import type { AssociateIdentityProps } from "../types/approval";

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
