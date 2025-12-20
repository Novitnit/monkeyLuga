import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "node20",
  clean: true,
  dts: true,
  splitting: false
});
