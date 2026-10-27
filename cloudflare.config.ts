import { bindings, defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "ferdousbhai-com",
		compatibilityDate: "2025-12-23",
		// Only the project clips run the script, which answers the byte-range
		// requests Safari needs to play video; the assets serve everything else.
		entrypoint: "./src/worker.js",
		assets: { runWorkerFirst: ["/img/work/*.mp4"] },
		env: { ASSETS: bindings.assets() },
		previewUrls: false,
		domains: ["ferdousbhai.com", "www.ferdousbhai.com"],
		workersDev: false,
	},
});
