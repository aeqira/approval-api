import { applyD1Migrations, D1Migration, env } from "cloudflare:test";
import { beforeAll } from "vitest";

declare global {
	namespace Cloudflare {
		interface Env {
			TEST_MIGRATIONS: D1Migration[];
		}
	}
}

beforeAll(async () => {
	await applyD1Migrations(env.approval_api_db, env.TEST_MIGRATIONS);
});
