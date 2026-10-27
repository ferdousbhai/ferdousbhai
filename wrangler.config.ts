import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig({
	// Workers Builds ignores this; its dashboard build command must remain `pnpm build`.
	build: {
		command: "pnpm build",
		// The stylesheet and markup live in scripts/, so watching content alone
		// leaves `cf dev` serving stale HTML after a design change.
		watchDir: ["content", "scripts"],
	},
	types: {
		generate: false,
	},
	// Requests are answered straight from these files, with public/_headers and
	// public/_redirects supplying the rest; only the project clips pass through
	// src/worker.js first (see cloudflare.config.ts).
	assetsDirectory: "./public",
});
