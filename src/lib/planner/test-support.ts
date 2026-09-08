import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

// O runner nativo do Node não carrega TSX. Transpila apenas os componentes
// reais em memória para verificar a apresentação, sem bundler ou mocks de UI.
const sourceRoot = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/") || specifier.startsWith(".")) {
      const url = specifier.startsWith("@/")
        ? new URL(specifier.slice(2), sourceRoot)
        : new URL(specifier, context.parentURL);
      const path = fileURLToPath(url);
      for (const suffix of [".ts", ".tsx", "/index.ts"]) {
        if (existsSync(path + suffix)) return next(pathToFileURL(path + suffix).href, context);
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith(".tsx")) {
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
        }).outputText,
      };
    }
    return next(url, context);
  },
});
