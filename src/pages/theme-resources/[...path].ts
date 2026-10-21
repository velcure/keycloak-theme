import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import type { APIRoute } from "astro";

const types: Record<string, string> = {
  css: "text/css",
  js: "text/javascript",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
};
export const GET: APIRoute = async ({ params }) => {
  const root = resolve(".cache/resources");
  const path = resolve(root, params.path ?? "");
  if (!path.startsWith(`${root}${sep}`))
    return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type":
          types[path.split(".").pop() ?? ""] ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
};
