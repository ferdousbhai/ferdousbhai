import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "ferdousbhai-com",
		compatibilityDate: "2025-12-23",
		previewUrls: false,
		domains: ["ferdousbhai.com", "www.ferdousbhai.com"],
		workersDev: false,
	},
});
