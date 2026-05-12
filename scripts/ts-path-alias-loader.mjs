import { pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const pathname = new URL(`../src/${specifier.slice(2)}`, import.meta.url).pathname;
    try {
      return await nextResolve(pathToFileURL(pathname).href, context);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ERR_MODULE_NOT_FOUND") {
        return nextResolve(pathToFileURL(`${pathname}.ts`).href, context);
      }
      throw error;
    }
  }
  return nextResolve(specifier, context);
}
