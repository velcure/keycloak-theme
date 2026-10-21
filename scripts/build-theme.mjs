import { spawnSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm(".cache/theme-package", { recursive: true, force: true });
await mkdir(".cache/theme-package/META-INF", { recursive: true });
await mkdir("artifacts", { recursive: true });
await cp("themes/velcure", ".cache/theme-package/theme/velcure", {
  recursive: true,
});
await writeFile(
  ".cache/theme-package/META-INF/keycloak-themes.json",
  JSON.stringify({
    themes: [{ name: "velcure", types: ["login", "email", "account"] }],
  }),
);
const result = spawnSync(
  "jar",
  [
    "--create",
    "--file",
    "artifacts/velcure-keycloak-theme.jar",
    "-C",
    ".cache/theme-package",
    ".",
  ],
  { stdio: "inherit" },
);
if (result.status !== 0)
  throw new Error("Theme packaging failed; Java 17+ is required.");
console.log("Built artifacts/velcure-keycloak-theme.jar");
