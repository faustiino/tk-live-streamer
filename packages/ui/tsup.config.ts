import { defineConfig } from "tsup";
import { cpSync } from "fs";
import { resolve } from "path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "es2022",
  treeshake: true,
  async onSuccess() {
    // copia manualmente o styles.css para a pasta dist
    const from = resolve(process.cwd(), "src/styles.css");
    const to = resolve(__dirname, "dist/styles.css");
    cpSync(from, to, { recursive: false });
    console.log("✅ Copiado styles.css para dist/");
  }
});
