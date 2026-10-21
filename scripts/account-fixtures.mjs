import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const pages = JSON.parse(await readFile("src/lib/account-pages.json", "utf8"));
export function sanitizeAccount(body, locale) {
  if (/<script\b|\bon\w+\s*=/i.test(body))
    throw new Error("Unexpected executable content in account capture");
  const ids = new Map();
  let html = body
    .replace(/\sdata-ouia-[\w-]+="[^"]*"/g, "")
    .replace(
      /(?:pf-|expandable-section-toggle-)\d{10,}[a-z\d]*|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi,
      (id) => {
        if (!ids.has(id)) ids.set(id, `fixture-${ids.size + 1}`);
        return ids.get(id);
      },
    );
  html = html.replace(
    /\/resources\/[^/]+\/account\/velcure\//g,
    "/theme-resources/account/",
  );
  html = html.replace(/href="([^"]*)"/g, (_, href) => {
    if (href.startsWith("#")) return `href="${href}"`;
    const url = new URL(href.replaceAll("&amp;", "&"), "http://127.0.0.1:8082");
    const prefix = "/realms/velcure-preview/account/";
    if (url.pathname.startsWith(prefix)) {
      const path = url.pathname.slice(prefix.length).replace(/\/$/, "");
      const page = pages.find((entry) => entry.path === path);
      return `href="/render/account/${page?.id ?? "personal-info"}?locale=${locale}"`;
    }
    if (url.hostname === "velcure.de" || url.hostname === "www.velcure.de")
      return `href="${url.href}"`;
    return 'href="#preview-action"';
  });
  html = html
    .replaceAll("http://127.0.0.1:8082", "https://login.example.invalid")
    .replace(/172\.\d+\.\d+\.\d+/g, "192.0.2.10");
  if (
    /session_state=|session_code=|access_token|id_token|code_challenge|eyJ[\w-]{20,}\.[\w-]+\./.test(
      html,
    )
  )
    throw new Error("Authentication data must not enter account fixtures");
  return html;
}
export async function writeAccountFixtures(captures) {
  const config = JSON.parse(await readFile("keycloak-version.json", "utf8"));
  const realm = JSON.parse(
    await readFile("fixtures/realm/velcure-preview.json", "utf8"),
  );
  const profile = realm.users[0];
  const escapeAttribute = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  for (const locale of ["de", "en"])
    for (const page of pages) {
      const entry = captures.find(
        (row) => row.id === page.id && row.locale === locale,
      );
      if (!entry?.body || !entry.heading)
        throw new Error(`Missing account capture: ${locale}/${page.id}`);
      let body = sanitizeAccount(entry.body, locale);
      if (page.id === "personal-info") {
        body = body.replace(/<input\b[^>]*>/g, (input) => {
          const id = input.match(/id="([^"]+)"/)?.[1];
          if (
            !id ||
            !["username", "email", "firstName", "lastName"].includes(id)
          )
            return input;
          // React keeps controlled values as DOM properties. Rehydrate only the
          // four public profile fields from the same disposable realm fixture.
          return input
            .replace(/ value="[^"]*"/, "")
            .replace(/>$/, ` value="${escapeAttribute(profile[id])}">`);
        });
      }
      await mkdir(`fixtures/account/${locale}`, { recursive: true });
      await writeFile(
        `fixtures/account/${locale}/${page.id}.html`,
        `${body}\n`,
      );
    }
  await writeFile(
    "fixtures/account/metadata.json",
    `${JSON.stringify({ keycloak: config.version, accountSha256: config.accountSha256, source: "Native keycloak.v3 Account Console, isolated velcure-preview realm. Visual fixtures only; no authentication runtime." }, null, 2)}\n`,
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const input = process.argv[2];
  if (!input)
    throw new Error("Usage: node scripts/account-fixtures.mjs <captures.json>");
  await writeAccountFixtures(JSON.parse(await readFile(input, "utf8")));
}
