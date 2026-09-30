import { Clipboard24Regular } from "@fluentui/react-icons/svg/clipboard";
import { Dismiss24Regular } from "@fluentui/react-icons/svg/dismiss";
import { useEffect, useRef } from "react";
import {
	copyTextToClipboard,
	splitOriginalComment,
} from "../functions/helpers";
import type { AccountCommentModalProps } from "../types/approval";

const FOCUSABLE_SELECTOR = [
	"button:not([disabled])",
	"[href]",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	'[tabindex]:not([tabindex="-1"])',
].join(",");

export function AccountCommentModal({
	submission,
	onClose,
}: AccountCommentModalProps) {
	const modalRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const previouslyFocusedElement = document.activeElement;
		const previousOverflow = document.body.style.overflow;
		const modal = modalRef.current;

		document.body.style.overflow = "hidden";
		modal?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
				return;
			}

			if (event.key !== "Tab" || !modal) {
				return;
			}

			const focusableElements = Array.from(
				modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			);

			if (focusableElements.length === 0) {
				return;
			}

			const firstElement = focusableElements[0];
			const lastElement = focusableElements.at(-1);

			if (event.shiftKey && document.activeElement === firstElement) {
				event.preventDefault();
				lastElement?.focus();
			} else if (!event.shiftKey && document.activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		}

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", handleKeyDown);

			if (previouslyFocusedElement instanceof HTMLElement) {
				previouslyFocusedElement.focus();
			}
		};
	}, [onClose]);

	return (
		<div
			className="comment-modal-backdrop"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) {
					onClose();
				}
			}}
		>
			<section
				aria-labelledby="comment-modal-title"
				aria-modal="true"
				className="comment-modal"
				ref={modalRef}
				role="dialog"
			>
				<div className="comment-modal-heading">
					<div>
						<p>Member {submission.memberNumber}</p>
						<h2 id="comment-modal-title">Account Comment</h2>
					</div>

					<button
						aria-label="Close account comment"
						className="comment-modal-close"
						type="button"
						onClick={onClose}
					>
						<Dismiss24Regular aria-hidden="true" />
					</button>
				</div>

				<div className="comment-modal-content">
					{submission.accountComment
						.split("\n\n")
						.filter(Boolean)
						.map((block, blockIndex) => {
							const entries =
								blockIndex === 0
									? splitOriginalComment(block)
									: block.split("\n").filter(Boolean);

							return (
								<div
									className={`comment-log comment-log--${blockIndex === 0 ? "original" : "manager"}`}
									key={`${blockIndex}-${block}`}
								>
									<h3>
										{blockIndex === 0
											? "Original Decision Log"
											: "Manager Decision Log"}
									</h3>
									<ul>
										{entries.map((line, lineIndex) => (
											<li key={`${lineIndex}-${line}`}>{line}</li>
										))}
									</ul>
								</div>
							);
						})}
				</div>

				<div className="comment-modal-actions">
					<button
						className="secondary-button"
						type="button"
						onClick={() =>
							void copyTextToClipboard(submission.accountComment)
						}
					>
						<Clipboard24Regular aria-hidden="true" />
						Copy Comment
					</button>
					<button className="primary-button" type="button" onClick={onClose}>
						Close
					</button>
				</div>
			</section>
		</div>
	);
}
