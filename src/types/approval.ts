export type PaymentChoice =
	| {
			type: 'minimum_plus_extra';
			extraAmount: number;
	  }
	| {
			type: 'affordable_payment';
			affordablePayment: number;
	  };

export interface ApprovalRequest {
	pastDueBalance: number;
	monthlyPayment: number;
	daysPastDue: number;
	regularDefermentCount: number;
	paymentChoice: PaymentChoice;
}

export type ApprovalStatus = 'approved' | 'denied' | 'manager_review';

export interface ApprovalResponse {
	status: ApprovalStatus;
	planPayment: number;
	catchUpAmount: number;
	numberOfPayments: number;
	finalPayment: number;
	regularDefermentAvailable: boolean;
	reasons: string[];
}
