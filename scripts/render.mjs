import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import QRCode from "qrcode";

const config = JSON.parse(await readFile("keycloak-version.json", "utf8"));
const jar = `.cache/freemarker-${config.freemarker}.jar`;
await mkdir(".cache", { recursive: true });
let bytes;
try {
  bytes = await readFile(jar);
} catch {
  const response = await fetch(
    `https://repo.maven.apache.org/maven2/org/freemarker/freemarker/${config.freemarker}/freemarker-${config.freemarker}.jar`,
  );
  if (!response.ok)
    throw new Error(`FreeMarker download failed: ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(jar, bytes);
}
if (
  config.freemarkerSha256 &&
  createHash("sha256").update(bytes).digest("hex") !== config.freemarkerSha256
)
  throw new Error("FreeMarker checksum mismatch");
const distribution = `.cache/keycloak-themes-${config.version}.jar`;
let distributionBytes;
try {
  distributionBytes = await readFile(distribution);
} catch {
  const response = await fetch(
    `https://repo.maven.apache.org/maven2/org/keycloak/keycloak-themes/${config.version}/keycloak-themes-${config.version}.jar`,
  );
  if (!response.ok)
    throw new Error(`Keycloak resource download failed: ${response.status}`);
  distributionBytes = Buffer.from(await response.arrayBuffer());
  await writeFile(distribution, distributionBytes);
}
if (
  createHash("sha256").update(distributionBytes).digest("hex") !==
  config.themesSha256
)
  throw new Error("Keycloak resource checksum mismatch");
const vendorJar = `.cache/keycloak-themes-vendor-${config.version}.jar`;
let vendorBytes;
try {
  vendorBytes = await readFile(vendorJar);
} catch {
  const response = await fetch(
    `https://repo.maven.apache.org/maven2/org/keycloak/keycloak-themes-vendor/${config.version}/keycloak-themes-vendor-${config.version}.jar`,
  );
  if (!response.ok)
    throw new Error(`Keycloak vendor download failed: ${response.status}`);
  vendorBytes = Buffer.from(await response.arrayBuffer());
  await writeFile(vendorJar, vendorBytes);
}
if (
  createHash("sha256").update(vendorBytes).digest("hex") !== config.vendorSha256
)
  throw new Error("Keycloak vendor checksum mismatch");
await mkdir(".cache/upstream", { recursive: true });
const extraction = spawnSync(
  "jar",
  ["--extract", "--file", `../keycloak-themes-${config.version}.jar`],
  { cwd: ".cache/upstream", stdio: "inherit" },
);
if (extraction.status !== 0)
  throw new Error("Could not extract Keycloak resources");
const vendorExtraction = spawnSync(
  "jar",
  ["--extract", "--file", `../keycloak-themes-vendor-${config.version}.jar`],
  { cwd: ".cache/upstream", stdio: "inherit" },
);
if (vendorExtraction.status !== 0)
  throw new Error("Could not extract Keycloak vendor resources");
for (const type of ["login", "email"]) {
  if (type === "login") {
    await cp(
      ".cache/upstream/theme/base/login/resources",
      ".cache/resources/login",
      { recursive: true },
    );
    await cp(
      ".cache/upstream/theme/keycloak.v2/login/resources",
      ".cache/resources/login",
      { recursive: true },
    );
  }
  await cp(`themes/velcure/${type}/resources`, `.cache/resources/${type}`, {
    recursive: true,
  });
}
await cp(
  ".cache/upstream/theme/keycloak/common/resources",
  ".cache/resources/common",
  { recursive: true },
);
await writeFile(
  ".cache/qr.txt",
  (
    await QRCode.toDataURL(
      "otpauth://totp/Velcure:preview?secret=JBSWY3DPEHPK3PXP&issuer=Velcure",
      { width: 200, margin: 2 },
    )
  ).split(",")[1],
);
const run = spawnSync(
  "java",
  ["--class-path", jar, "scripts/RenderPreviews.java"],
  { stdio: "inherit" },
);
process.exitCode = run.status ?? 1;
