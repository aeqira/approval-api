import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.aeqira.paymentplanreview",
	appName: "Payment Plan Review",
	webDir: "dist/client",
	server: {
		url: "https://approve.aeqira.com",
		cleartext: false,
	},
	ios: {
		contentInset: "automatic",
		preferredContentMode: "mobile",
	},
};

export default config;
