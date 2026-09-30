# Approval API

A React and Cloudflare Workers application that evaluates and records payment-plan proposals for past-due loans.

The application:

- Calculates days past due from the supplied past-due date.
- Calculates the proposed payment amount and term.
- Returns `approved`, `manager_review`, or `denied`.
- Determines whether a regular deferment is available.
- Generates a paste-ready account comment.
- Records every review in Cloudflare D1.
- Captures the authenticated user’s email address and displays their configured name.
- Provides a database-authorized manager review queue.
- Allows managers to approve or deny pending reviews.
- Preserves the API’s original decision and the manager’s final decision.
- Refreshes the manager queue automatically.
- Provides searchable, sortable, paginated submission history to all employees.
- Lets employees clear the review form and current result in one action.
- Supports minimum-plus-extra and affordable-payment proposals.

## Production

```text
https://approval-api.aeqira.workers.dev
```

Production access is protected by Cloudflare Access. Unauthenticated browser requests are redirected to the Access login page.

## Current scope

The following features are implemented:

- React associate review form
- Payment-plan decision API
- Cloudflare Access identity capture
- Authenticated-user identity display
- Associate email storage
- User display-name storage and display
- D1 approval-review storage
- Paste-ready account comments
- Database-backed manager authorization
- Manager review queue
- Manager approval and denial actions
- Automatic manager queue refresh
- All-submissions history with filters, sorting, and expandable account comments
- Final paste-ready comments for manager decisions
- Clear-form action
- Original and final decision preservation
- Local D1 migration testing
- OpenAPI documentation
- Automated decision, identity, authorization, and manager-action tests

The user administration interface and manager decision reporting remain outside the current scope.

## API endpoints

### Health check

```text
GET /api/v1/health
```

Response:

```json
{
	"name": "Approval API",
	"status": "running"
}
```

### Authenticated identity

```text
GET /api/v1/identity
```

Returns the authenticated user’s normalized email address, display name, and application role.

Users are treated as associates by default. An authenticated user receives the `manager` role only when their email has an active manager record in the `users` table.

Associate response:

```json
{
	"email": "associate@aeqira.com",
	"displayName": "associate@aeqira.com",
	"role": "associate"
}
```

Manager response:

```json
{
	"email": "arichard@aeqira.com",
	"displayName": "Andrew Richard",
	"role": "manager"
}
```

If an authenticated identity is unavailable, the endpoint returns HTTP status `401`:

```json
{
	"error": "Authentication required"
}
```

### Evaluate a payment plan

```text
POST /api/v1/approval
```

The endpoint requires an authenticated identity. In production, the identity is supplied by Cloudflare Access.

Every valid decision is saved in D1 before the response is returned.

### List all submissions

```text
GET /api/v1/submissions
```

All authenticated employees can view submission history so they can assist one another. The endpoint supports:

- Search by member number, employee name, or employee email
- Status and deferment filters
- From and to dates
- Sorting by submission date, member, status, adjusted delinquency, adjusted balance, or payment count
- Ascending or descending order
- Pagination with a maximum page size of 100

Example:

```text
GET /api/v1/submissions?search=Andrew&status=approved&sortBy=createdAt&sortDirection=desc&page=1&pageSize=25
```

The response includes each submission’s original and current status, calculated plan details, employee name, and the current paste-ready account comment.

### List pending manager reviews

```text
GET /api/v1/manager/reviews
```

Returns up to 100 pending manager reviews in oldest-first order.

The authenticated email must belong to an active manager in the `users` table.

The manager dashboard requests this endpoint when the queue opens and refreshes it automatically every five seconds.

Example response:

```json
{
	"reviews": [
		{
			"reviewId": "72b708ee-957b-466f-9cd6-fd3e09aca998",
			"memberNumber": "123456",
			"associateEmail": "associate@aeqira.com",
			"associateDisplayName": "Associate Name",
			"pastDueDate": "2026-08-15",
			"daysPastDue": 45,
			"adjustedDaysPastDue": 45,
			"pastDueBalance": 600,
			"adjustedPastDueBalance": 600,
			"monthlyPayment": 300,
			"planPayment": 400,
			"numberOfPayments": 6,
			"regularDefermentAvailable": false,
			"regularDefermentApplied": false,
			"defermentMonths": 0,
			"deferredAmount": 0,
			"reasons": ["The loan remains between 31 and 89 days delinquent after deferment."],
			"createdAt": "2026-09-29 10:11:22"
		}
	]
}
```

### Resolve a manager review

```text
PATCH /api/v1/manager/reviews/{reviewId}
```

The authenticated email must belong to an active manager in the `users` table.

Example approval request:

```json
{
	"status": "approved",
	"reason": "Payment history supports approval."
}
```

Example denial request:

```json
{
	"status": "denied",
	"reason": "The proposed arrangement is not supportable."
}
```

Managers may set the final status to `approved` or `denied`. A nonempty reason of no more than 1,000 characters is required.

Example response:

```json
{
	"reviewId": "72b708ee-957b-466f-9cd6-fd3e09aca998",
	"status": "approved",
	"managerEmail": "arichard@aeqira.com",
	"managerDisplayName": "Andrew Richard",
	"managerReason": "Payment history supports approval.",
	"accountComment": "Payment plan decision: MANAGER REVIEW. Member number: 123456. Due date: 2026-08-15. Original days delinquent: 45. Adjusted days delinquent: 45. Original delinquent balance: $600.00. Adjusted delinquent balance: $600.00. Regular deferment not available. Plan payment: $400.00. Payment count: 6. Final payment: $400.00. Decision reason: The loan remains between 31 and 89 days delinquent after deferment.\n\nManager decision: APPROVED.\nManager: Andrew Richard.\nManager decision reason: Payment history supports approval.",
	"reviewedAt": "2026-09-29T11:30:00.000Z"
}
```

The original API decision remains stored in `initial_status`. The manager’s decision is stored in `current_status` along with the manager email, reason, and review timestamp. The final account comment preserves the complete original API comment, adds a blank line, and then appends the manager decision as a separate log entry with each field on its own line.

A pending review can only be resolved once. Attempts to change an already resolved review return HTTP status `404`.

## Approval request fields

| Field                   | Type        | Description                                              |
| ----------------------- | ----------- | -------------------------------------------------------- |
| `memberNumber`          | string      | Member or account identifier                             |
| `pastDueDate`           | date string | Date of the oldest unpaid payment in `YYYY-MM-DD` format |
| `pastDueBalance`        | number      | Total delinquent balance                                 |
| `monthlyPayment`        | number      | Current regular monthly payment                          |
| `regularDefermentCount` | integer     | Lifetime number of regular deferments used               |
| `paymentChoice`         | object      | Proposed payment option                                  |

The API calculates `daysPastDue` from `pastDueDate` using UTC calendar dates.

`pastDueDate` must be today or earlier.

## Payment choices

### Minimum payment plus extra

The member pays the regular monthly payment plus an additional amount toward the past-due balance.

Example request:

```json
{
	"memberNumber": "123456",
	"pastDueDate": "2026-09-09",
	"pastDueBalance": 650,
	"monthlyPayment": 300,
	"regularDefermentCount": 2,
	"paymentChoice": {
		"type": "minimum_plus_extra",
		"extraAmount": 100
	}
}
```

Calculation:

```text
plan payment = monthly payment + extra amount
catch-up amount = extra amount
```

For the example:

```text
plan payment = 300 + 100 = 400
catch-up amount = 100
number of payments = ceiling(650 / 100) = 7
final payment = 350
```

### Affordable payment

The member supplies the total monthly amount they can afford.

Example request:

```json
{
	"memberNumber": "123456",
	"pastDueDate": "2026-09-09",
	"pastDueBalance": 650,
	"monthlyPayment": 300,
	"regularDefermentCount": 2,
	"paymentChoice": {
		"type": "affordable_payment",
		"affordablePayment": 400
	}
}
```

Calculation:

```text
plan payment = affordable payment
catch-up amount = affordable payment - monthly payment
```

For the example:

```text
plan payment = 400
catch-up amount = 400 - 300 = 100
number of payments = ceiling(650 / 100) = 7
final payment = 350
```

The affordable payment must exceed the regular monthly payment. Otherwise, no portion of the payment would reduce the past-due balance.

## Approval response

Example:

```json
{
	"reviewId": "72b708ee-957b-466f-9cd6-fd3e09aca998",
	"status": "approved",
	"daysPastDue": 20,
	"adjustedDaysPastDue": 20,
	"adjustedPastDueBalance": 650,
	"planPayment": 400,
	"catchUpAmount": 100,
	"numberOfPayments": 7,
	"finalPayment": 350,
	"regularDefermentAvailable": false,
	"regularDefermentApplied": false,
	"defermentMonths": 0,
	"deferredAmount": 0,
	"reasons": ["All automatic approval criteria were met."],
	"accountComment": "Payment plan decision: APPROVED. Member number: 123456. Due date: 2026-09-09. Original days delinquent: 20. Adjusted days delinquent: 20. Original delinquent balance: $650.00. Adjusted delinquent balance: $650.00. Regular deferment not available. Plan payment: $400.00. Payment count: 7. Final payment: $350.00. Decision reason: All automatic approval criteria were met."
}
```

### Response fields

| Field                       | Type         | Description                                                 |
| --------------------------- | ------------ | ----------------------------------------------------------- |
| `reviewId`                  | string       | Unique identifier for the saved approval review             |
| `status`                    | string       | `approved`, `manager_review`, or `denied`                   |
| `daysPastDue`               | integer      | Calculated number of calendar days past due                 |
| `adjustedDaysPastDue`       | integer      | Days delinquent remaining after any deferment               |
| `adjustedPastDueBalance`    | number       | Delinquent balance remaining after any deferment            |
| `planPayment`               | number       | Normal payment amount during the plan                       |
| `catchUpAmount`             | number       | Amount applied toward the past-due balance per payment      |
| `numberOfPayments`          | integer      | Calculated number of payments required                      |
| `finalPayment`              | number       | Reduced final payment when the remaining balance is smaller |
| `regularDefermentAvailable` | boolean      | Whether a regular deferment can still be offered            |
| `regularDefermentApplied`   | boolean      | Whether the three-month regular deferment was applied       |
| `defermentMonths`           | integer      | Number of months deferred: `0` or `3`                       |
| `deferredAmount`            | number       | Amount removed from delinquency by the deferment            |
| `reasons`                   | string array | Reasons supporting the decision                             |
| `accountComment`            | string       | Paste-ready servicing-system comment                        |

## Decision rules

### Approved

A proposal is automatically approved when:

- The loan is between 0 and 30 days past due, inclusive.
- The plan requires between 1 and 12 payments.
- The proposed payment exceeds the regular monthly payment.
- No denial condition applies.

### Manager review

A proposal requires manager review when:

- The loan is between 31 and 89 days past due, inclusive.
- The plan requires between 13 and 18 payments.
- No denial condition applies.

More than one manager-review reason may be returned.

### Denied

A proposal is denied when:

- The loan is 90 or more days past due.
- The plan requires more than 18 payments.
- The proposed payment does not exceed the regular monthly payment.

Denial conditions take precedence over manager-review conditions.

## Regular deferments

A regular deferment is available when:

```text
regular deferment count < 2
```

When a deferment is available, the API applies it before evaluating the plan. It removes up to three regular monthly payments from the delinquent balance and subtracts 90 days from the delinquency, with both adjusted values floored at zero.

If the deferment brings both adjusted delinquency and adjusted balance to zero, the request is automatically approved for deferment only. When two or more regular deferments have already been used, `regularDefermentAvailable` is `false` and no deferment is applied.

Emergency deferments are not evaluated or offered.

## Interest and late fees

Interest and late fees may continue to accrue, but they are handled by the servicing system. They do not affect the payment-plan calculation performed by this API.

## Currency and rounding

Currency calculations are performed in cents.

The number of payments is rounded up so the delinquent balance is fully covered. When the remaining balance is smaller than the normal catch-up amount, the final payment is reduced.

## Review storage

Each valid decision is stored in the `approval_reviews` D1 table.

The stored record includes:

- Review ID
- Member number
- Associate email
- Associate display name resolved from the users table
- Past-due date
- Calculated days past due
- Past-due balance
- Monthly payment
- Payment choice
- Initial and current statuses
- Calculated plan details
- Decision reasons
- Account comment
- Final account comment after manager action
- Regular-deferment availability
- Manager email
- Manager decision reason
- Manager review timestamp
- Creation and update timestamps

The API’s original decision is stored in `initial_status`.

For reviews requiring manager action, the final approval or denial is stored in `current_status`. The update is guarded so only records currently in `manager_review` can be resolved.

If an approval review cannot be saved, the endpoint returns HTTP status `500` instead of returning an unrecorded decision.

## Users and manager authorization

Application roles are stored in the `users` D1 table.

The table contains:

- Email address
- Display name
- Role
- Active status
- Creation timestamp
- Update timestamp

Supported roles are:

```text
associate
manager
```

Authenticated users are treated as associates unless an active user record grants them the manager role. When no display name is stored, the interface falls back to the user’s email address.

Manager API endpoints verify the authenticated email against the `users` table on every request. Hiding the Manager Queue in the frontend is not the security boundary; manager authorization is enforced by the Worker.

To grant manager access locally:

```bash
npx wrangler d1 execute approval-api-db --local --command \
"INSERT INTO users (email, role, active)
VALUES ('manager@aeqira.com', 'manager', 1)
ON CONFLICT(email) DO UPDATE SET
	role = 'manager',
	active = 1,
	updated_at = CURRENT_TIMESTAMP;"
```

To grant manager access in production:

```bash
npx wrangler d1 execute approval-api-db --remote --command \
"INSERT INTO users (email, role, active)
VALUES ('manager@aeqira.com', 'manager', 1)
ON CONFLICT(email) DO UPDATE SET
	role = 'manager',
	active = 1,
	updated_at = CURRENT_TIMESTAMP;"
```

To deactivate a manager without deleting the audit record:

```bash
npx wrangler d1 execute approval-api-db --remote --command \
"UPDATE users
SET active = 0,
	updated_at = CURRENT_TIMESTAMP
WHERE email = 'manager@aeqira.com';"
```

## Authentication

Production authentication is handled by Cloudflare Access.

The Worker retrieves the authenticated email address and stores it as the associate ID for new reviews. The frontend retrieves the same identity and application role through:

```text
GET /api/v1/identity
```

If no valid authenticated email is available, the Worker returns HTTP status `401`:

```json
{
	"error": "Authentication required"
}
```

If an authenticated user attempts to access a manager endpoint without an active manager record, the Worker returns HTTP status `403`:

```json
{
	"error": "Manager access required"
}
```

## Invalid requests

Invalid JSON, missing fields, invalid values, impossible dates, and future past-due dates return HTTP status `400`.

Example:

```json
{
	"error": "Invalid approval request",
	"requiredFields": [
		"memberNumber",
		"pastDueDate",
		"pastDueBalance",
		"monthlyPayment",
		"regularDefermentCount",
		"paymentChoice"
	]
}
```

An invalid manager decision returns:

```json
{
	"error": "Invalid manager decision request",
	"requiredFields": ["status", "reason"]
}
```

## Local development

Install dependencies:

```bash
npm install
```

Generate Cloudflare binding types after changing `wrangler.jsonc`:

```bash
npm run cf-typegen
```

Apply D1 migrations to the local development database:

```bash
npx wrangler d1 migrations apply approval-api-db --local
```

Set the simulated development identity in `wrangler.jsonc`:

```jsonc
"access": {
	"dev": {
		"aud": "approval-api-local",
		"identity": {
			"email": "arichard@aeqira.com"
		}
	}
}
```

This simulated identity applies only to local development.

Start the React application and local Worker:

```bash
npm run dev
```

Vite normally serves the application at:

```text
http://localhost:5173
```

Use the exact URL printed in the terminal if Vite selects a different port.

### Test the health endpoint

```bash
curl http://localhost:5173/api/v1/health
```

### Test the identity endpoint

```bash
curl http://localhost:5173/api/v1/identity
```

Expected manager response when the simulated development identity has an active manager record:

```json
{
	"email": "arichard@aeqira.com",
	"displayName": "Andrew Richard",
	"role": "manager"
}
```

### Test an approval request

On macOS, create a date 20 days in the past:

```bash
PAST_DUE_DATE=$(date -u -v-20d +%F)
```

Then submit the request:

```bash
curl -X POST http://localhost:5173/api/v1/approval \
	-H "Content-Type: application/json" \
	-d "{
		\"memberNumber\": \"123456\",
		\"pastDueDate\": \"$PAST_DUE_DATE\",
		\"pastDueBalance\": 650,
		\"monthlyPayment\": 300,
		\"regularDefermentCount\": 1,
		\"paymentChoice\": {
			\"type\": \"minimum_plus_extra\",
			\"extraAmount\": 100
		}
	}"
```

The response should include a generated `reviewId`.

### Create a manager-review test record

On macOS, create a date 45 days in the past:

```bash
PAST_DUE_DATE=$(date -u -v-45d +%F)
```

Submit a request that requires manager review:

```bash
curl -X POST http://localhost:5173/api/v1/approval \
	-H "Content-Type: application/json" \
	-d "{
		\"memberNumber\": \"123456\",
		\"pastDueDate\": \"$PAST_DUE_DATE\",
		\"pastDueBalance\": 600,
		\"monthlyPayment\": 300,
		\"regularDefermentCount\": 0,
		\"paymentChoice\": {
			\"type\": \"minimum_plus_extra\",
			\"extraAmount\": 100
		}
	}"
```

### Test the manager queue

```bash
curl http://localhost:5173/api/v1/manager/reviews
```

### Test a manager decision

Replace `REVIEW_ID` with the review ID returned by the approval endpoint:

```bash
curl -X PATCH \
	http://localhost:5173/api/v1/manager/reviews/REVIEW_ID \
	-H "Content-Type: application/json" \
	-d '{
		"status": "approved",
		"reason": "Payment history supports approval."
	}'
```

The authenticated-user header used in automated tests is intended only for tests. Production identity is supplied by Cloudflare Access.

## Database migrations

Database migrations are stored in:

```text
migrations/
```

Apply pending migrations locally:

```bash
npx wrangler d1 migrations apply approval-api-db --local
```

Apply pending migrations to production:

```bash
npx wrangler d1 migrations apply approval-api-db --remote
```

Review pending migrations before applying them to production.

## Validation

Run all automated tests:

```bash
npm test -- --run
```

Run the test TypeScript check:

```bash
npx tsc -p test/tsconfig.json --noEmit
```

Run the application TypeScript and production build checks:

```bash
npm run build
```

Validate the OpenAPI specification:

```bash
npx --yes @redocly/cli@2.55.0 lint openapi.yaml
```

Check production dependencies:

```bash
npm audit --omit=dev
```

Validate the Cloudflare deployment package without deploying:

```bash
npx wrangler deploy --dry-run
```

## Deployment

Before deploying, apply pending production D1 migrations:

```bash
npx wrangler d1 migrations apply approval-api-db --remote
```

Deploy the frontend and Worker:

```bash
npm run deploy
```

Production URL:

```text
https://approval-api.aeqira.workers.dev
```

Because production is protected by Cloudflare Access, unauthenticated requests will be redirected to the Access login page.

## API specification

The complete OpenAPI 3.1 specification is available in:

```text
openapi.yaml
```
