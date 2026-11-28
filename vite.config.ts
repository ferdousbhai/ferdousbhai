import { execFileSync } from "node:child_process";
import { relative } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, type Plugin } from "vite";

// The pages are written into public/ by scripts/build.js, and Vite copies
// public/ whole into the Worker's assets, so the site is built before Vite
// starts: once for a build, and again in `cf dev` whenever content/ or
// scripts/ (where the stylesheet and markup live) change.
function site(): Plugin {
	const build = () => execFileSync(process.execPath, ["scripts/build.js"], { stdio: "inherit" });
	return {
		name: "site",
		config: () => build(),
		configureServer(server) {
			server.watcher.add(["content", "scripts"]);
			server.watcher.on("all", (_event, file) => {
				if (!/^(content|scripts)\//.test(relative(server.config.root, file))) return;
				build();
				server.ws.send({ type: "full-reload" });
			});
		},
	};
}

export default defineConfig({ plugins: [site(), cloudflare()] });
