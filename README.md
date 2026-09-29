# Approval API

A protected Cloudflare Worker API that evaluates payment-plan proposals for past-due loans.

## Live API

`https://approval-api.aeqira.workers.dev`

The production API is protected by Cloudflare Access.

## Endpoints

### Health check

`GET /`

Response:

```json
{
	"name": "Approval API",
	"status": "running"
}
```

### Evaluate a payment plan

`POST /api/approval`

## Request fields

| Field                   | Type    | Description                                  |
| ----------------------- | ------- | -------------------------------------------- |
| `pastDueBalance`        | number  | Total past-due balance                       |
| `monthlyPayment`        | number  | Current regular monthly payment              |
| `daysPastDue`           | integer | Number of days the loan is past due          |
| `regularDefermentCount` | integer | Number of regular deferments previously used |
| `paymentChoice`         | object  | Customer’s proposed payment option           |

## Payment choices

### Minimum payment plus extra

The customer pays the regular monthly payment plus an additional amount toward the past-due balance.

```json
{
	"pastDueBalance": 650,
	"monthlyPayment": 300,
	"daysPastDue": 20,
	"regularDefermentCount": 1,
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

For the example above:

```text
plan payment = 300 + 100 = 400
catch-up amount = 100
number of payments = ceiling(650 / 100) = 7
final payment = 350
```

### Affordable payment

The customer supplies the total monthly amount they can afford.

```json
{
	"pastDueBalance": 650,
	"monthlyPayment": 300,
	"daysPastDue": 20,
	"regularDefermentCount": 1,
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

For the example above:

```text
plan payment = 400
catch-up amount = 400 - 300 = 100
number of payments = ceiling(650 / 100) = 7
final payment = 350
```

The affordable payment must exceed the regular monthly payment. Otherwise, none of the payment would reduce the past-due balance.

## Example response

```json
{
	"status": "approved",
	"planPayment": 400,
	"catchUpAmount": 100,
	"numberOfPayments": 7,
	"finalPayment": 350,
	"regularDefermentAvailable": true,
	"reasons": ["All automatic approval criteria were met."]
}
```

## Response fields

| Field                       | Type         | Description                                                 |
| --------------------------- | ------------ | ----------------------------------------------------------- |
| `status`                    | string       | `approved`, `manager_review`, or `denied`                   |
| `planPayment`               | number       | Normal payment amount during the plan                       |
| `catchUpAmount`             | number       | Amount applied toward the past-due balance per payment      |
| `numberOfPayments`          | integer      | Calculated number of payments required                      |
| `finalPayment`              | number       | Reduced final payment when the remaining balance is smaller |
| `regularDefermentAvailable` | boolean      | Whether a regular deferment can still be offered            |
| `reasons`                   | string array | Explanation of the decision                                 |

## Decision rules

### Approved

A proposal is eligible for automatic approval when:

- The loan is between 0 and 30 days past due.
- The plan requires between 1 and 12 payments.
- The proposed payment exceeds the regular monthly payment.
- No denial condition applies.

### Manager review

A proposal requires manager review when:

- The loan is between 31 and 89 days past due.
- The plan requires between 13 and 18 payments.
- No denial condition applies.

More than one manager-review reason may be returned.

### Denied

A proposal is denied when:

- The loan is 90 or more days past due.
- The plan requires more than 18 payments.
- The affordable payment does not exceed the regular monthly payment.

Hard-denial conditions take precedence over manager-review conditions.

## Regular deferments

A regular deferment is available when:

```text
regular deferment count < 2
```

When two or more regular deferments have already been used, `regularDefermentAvailable` is `false`.

Deferment history does not approve, deny, or escalate a payment plan. It only determines whether a regular deferment can be offered.

Emergency deferments are not evaluated or offered by this API.

## Interest and late fees

Interest and late fees may continue to accrue, but they are handled by the servicing system. They are not included in this API’s payment-plan calculation.

## Rounding

Currency calculations are performed in cents.

The number of payments is rounded up so the past-due balance is fully covered. When the remaining past-due balance is smaller than the normal catch-up amount, the final payment is reduced.

## Invalid requests

Invalid JSON or missing fields return HTTP status `400`.

Example:

```json
{
	"error": "Invalid approval request.",
	"requiredFields": ["pastDueBalance", "monthlyPayment", "daysPastDue", "regularDefermentCount", "paymentChoice"]
}
```

## Local development

Install dependencies:

```bash
npm install
```

Start the Worker:

```bash
npm run dev
```

The local API runs at:

```text
http://localhost:8787
```

Test the health endpoint:

```bash
curl http://localhost:8787/
```

Test an approval request:

```bash
curl -X POST http://localhost:8787/api/approval \
  -H "Content-Type: application/json" \
  -d '{
    "pastDueBalance": 650,
    "monthlyPayment": 300,
    "daysPastDue": 20,
    "regularDefermentCount": 1,
    "paymentChoice": {
      "type": "minimum_plus_extra",
      "extraAmount": 100
    }
  }'
```

## Validation

Check TypeScript:

```bash
npx tsc --noEmit
```

Run all automated tests:

```bash
npm test -- --run
```

Check production dependencies:

```bash
npm audit --omit=dev
```

## Deployment

Deploy the Worker:

```bash
npm run deploy
```

Production URL:

```text
https://approval-api.aeqira.workers.dev
```

Because the production API is protected by Cloudflare Access, unauthenticated requests are redirected to the Access login page.
