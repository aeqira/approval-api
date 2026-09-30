import { Delete24Regular } from "@fluentui/react-icons/svg/delete";
import { Filter24Regular } from "@fluentui/react-icons/svg/filter";
import type {
	SubmissionFiltersProps,
	SubmissionSortField,
	SortDirection,
} from "../types/approval";

export function SubmissionFilters({
	filters,
	sortBy,
	sortDirection,
	onApply,
	onChange,
	onClear,
	onSortByChange,
	onSortDirectionChange,
}: SubmissionFiltersProps) {
	return (
		<form className="submission-filters" onSubmit={onApply}>
			<label>
				<span>Search</span>
				<input
					type="search"
					placeholder="Member number, employee name, or email"
					value={filters.search}
					onChange={(event) =>
						onChange({ ...filters, search: event.target.value })
					}
				/>
			</label>

			<label>
				<span>Status</span>
				<select
					value={filters.status}
					onChange={(event) =>
						onChange({
							...filters,
							status: event.target.value as typeof filters.status,
						})
					}
				>
					<option value="">All statuses</option>
					<option value="approved">Approved</option>
					<option value="denied">Denied</option>
					<option value="manager_review">Review</option>
				</select>
			</label>

			<label>
				<span>Deferment</span>
				<select
					value={filters.defermentApplied}
					onChange={(event) =>
						onChange({
							...filters,
							defermentApplied: event.target
								.value as typeof filters.defermentApplied,
						})
					}
				>
					<option value="">All submissions</option>
					<option value="true">Applied</option>
					<option value="false">Not applied</option>
				</select>
			</label>

			<label>
				<span>From</span>
				<input
					type="date"
					value={filters.dateFrom}
					onChange={(event) =>
						onChange({ ...filters, dateFrom: event.target.value })
					}
				/>
			</label>

			<label>
				<span>To</span>
				<input
					type="date"
					value={filters.dateTo}
					onChange={(event) =>
						onChange({ ...filters, dateTo: event.target.value })
					}
				/>
			</label>

			<label>
				<span>Sort By</span>
				<select
					value={sortBy}
					onChange={(event) =>
						onSortByChange(event.target.value as SubmissionSortField)
					}
				>
					<option value="createdAt">Submission Date</option>
					<option value="memberNumber">Member Number</option>
					<option value="status">Status</option>
					<option value="daysPastDue">Adjusted Days Delinquent</option>
					<option value="pastDueBalance">Adjusted Delinquent Balance</option>
					<option value="numberOfPayments">Payment Count</option>
				</select>
			</label>

			<label>
				<span>Direction</span>
				<select
					value={sortDirection}
					onChange={(event) =>
						onSortDirectionChange(event.target.value as SortDirection)
					}
				>
					<option value="desc">Descending</option>
					<option value="asc">Ascending</option>
				</select>
			</label>

			<div className="submission-filter-actions">
				<button className="primary-button" type="submit">
					<Filter24Regular aria-hidden="true" />
					Apply Filters
				</button>
				<button className="secondary-button" type="button" onClick={onClear}>
					<Delete24Regular aria-hidden="true" />
					Clear Filters
				</button>
			</div>
		</form>
	);
}
