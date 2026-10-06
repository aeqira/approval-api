const CACHE_NAME = "payment-plan-review-v1";
const APP_SHELL = [
	"/",
	"/manifest.webmanifest",
	"/payment-plan-review.svg",
	"/icons/app-icon-192.png",
	"/icons/app-icon-512.png",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_NAME)
						.map((key) => caches.delete(key)),
				),
		),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const requestUrl = new URL(event.request.url);

	if (
		event.request.method !== "GET" ||
		requestUrl.origin !== self.location.origin ||
		requestUrl.pathname.startsWith("/api/")
	) {
		return;
	}

	if (event.request.mode === "navigate") {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					const responseCopy = response.clone();
					void caches
						.open(CACHE_NAME)
						.then((cache) => cache.put("/", responseCopy));
					return response;
				})
				.catch(() => caches.match("/").then((response) => response ?? Response.error())),
		);
		return;
	}

	event.respondWith(
		caches.match(event.request).then(
			(cachedResponse) =>
				cachedResponse ??
				fetch(event.request).then((response) => {
					if (response.ok) {
						const responseCopy = response.clone();
						void caches
							.open(CACHE_NAME)
							.then((cache) => cache.put(event.request, responseCopy));
					}

					return response;
				}),
		),
	);
});
