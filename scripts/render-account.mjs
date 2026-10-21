import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";

export async function renderAccount() {
  const config = JSON.parse(await readFile("keycloak-version.json", "utf8"));
  const artifact = `.cache/keycloak-account-ui-${config.version}.jar`;
  let bytes;
  try {
    bytes = await readFile(artifact);
  } catch {
    const response = await fetch(
      `https://repo.maven.apache.org/maven2/org/keycloak/keycloak-account-ui/${config.version}/keycloak-account-ui-${config.version}.jar`,
    );
    if (!response.ok)
      throw new Error(`Account UI download failed: ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(artifact, bytes);
  }
  if (createHash("sha256").update(bytes).digest("hex") !== config.accountSha256)
    throw new Error("Keycloak account UI checksum mismatch");
  await mkdir(".cache/account-upstream", { recursive: true });
  const extraction = spawnSync(
    "jar",
    ["--extract", "--file", `../keycloak-account-ui-${config.version}.jar`],
    { cwd: ".cache/account-upstream", stdio: "inherit" },
  );
  if (extraction.status !== 0)
    throw new Error("Could not extract native Account Console");
  const source = ".cache/account-upstream/theme/keycloak.v3/account/resources";
  await cp(source, ".cache/resources/account", { recursive: true });
  await cp("themes/velcure/account/resources", ".cache/resources/account", {
    recursive: true,
  });
  const meta = JSON.parse(
    await readFile("fixtures/account/metadata.json", "utf8"),
  );
  if (
    meta.keycloak !== config.version ||
    meta.accountSha256 !== config.accountSha256
  )
    throw new Error(
      "Account visual fixtures must be refreshed for this Keycloak version",
    );
  const css = (await readdir(`${source}/assets`))
    .filter((name) => name.endsWith(".css"))
    .sort(
      (a, b) =>
        Number(b.startsWith("main-")) - Number(a.startsWith("main-")) ||
        a.localeCompare(b),
    );
  const styles = [
    ...css.map((name) => `/theme-resources/account/assets/${name}`),
    "/theme-resources/account/css/velcure-account.css",
    "/theme-resources/account/css/account-layout.css",
    "/account-preview.css",
  ];
  const pages = JSON.parse(
    await readFile("src/lib/account-pages.json", "utf8"),
  );
  for (const page of pages)
    for (const locale of ["de", "en"]) {
      const body = await readFile(
        `fixtures/account/${locale}/${page.id}.html`,
        "utf8",
      );
      const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Velcure · Account preview</title>${styles.map((src) => `<link rel="stylesheet" href="${src}">`).join("")}<script type="module" src="/account-preview.js"></script></head><body data-account-preview>${body}<p class="vc-preview-notice" role="status" hidden></p></body></html>`;
      await mkdir(`.cache/previews/account/${page.id}`, { recursive: true });
      await writeFile(
        `.cache/previews/account/${page.id}/${locale}-default.html`,
        html,
      );
    }
  console.log(
    `Rendered ${pages.length * 2} native Account Console visual fixtures`,
  );
}
