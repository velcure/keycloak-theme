import { readFile } from "node:fs/promises";
import type { APIRoute } from "astro";
import { catalog, errorPages } from "../../../lib/catalog";

export const GET: APIRoute = async ({ params, url }) => {
  const { type, id } = params;
  if (
    !(await catalog()).some((entry) => entry.type === type && entry.id === id)
  )
    return new Response("Not found", { status: 404 });
  const locale = url.searchParams.get("locale") === "en" ? "en" : "de";
  const state =
    type === "login" &&
    errorPages.has(id ?? "") &&
    url.searchParams.get("state") === "error"
      ? "error"
      : "default";
  const text = type === "email" && url.searchParams.get("format") === "text";
  const content = await readFile(
    `.cache/previews/${type}/${id}/${locale}-${state}.${text ? "txt" : "html"}`,
    "utf8",
  );
  return new Response(content, {
    headers: {
      "Content-Type": `${text ? "text/plain" : "text/html"}; charset=utf-8`,
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
      ...(type === "account"
        ? {
            "Content-Security-Policy":
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; form-action 'none'; frame-ancestors 'self'; base-uri 'none'",
          }
        : {}),
    },
  });
};
