export const API_BASE_URL = "/api/v1";

export const API_ROUTES = {
	approval: `${API_BASE_URL}/approval`,
	health: `${API_BASE_URL}/health`,
	identity: `${API_BASE_URL}/identity`,
	managerReview: (reviewId: string) =>
		`${API_BASE_URL}/manager/reviews/${encodeURIComponent(reviewId)}`,
	managerReviews: `${API_BASE_URL}/manager/reviews`,
} as const;
