import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  session: { driver: {entrypoint: "unstorage/drivers/memory"} },
  adapter: cloudflare({imageService: "passthrough", inspectorPort: false, prerenderEnvironment: "node"})
});
