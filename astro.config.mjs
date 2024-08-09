import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import simpleStackQuery from "simple-stack-query";

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind(), simpleStackQuery()],
});
