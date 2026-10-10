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
	// No Worker script: every request is answered straight from these files,
	// with public/_headers and public/_redirects supplying the rest.
	assetsDirectory: "./public",
});
