import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manifest = JSON.parse(await readFile(".cache/manifest.json", "utf8"));
const read = (path) => readFile(path, "utf8");

test("all inherited pages render in both languages and every email has a text alternative", async () => {
  assert.ok(manifest.filter((entry) => entry.type === "login").length >= 40);
  assert.ok(manifest.filter((entry) => entry.type === "email").length >= 18);
  for (const entry of manifest)
    for (const locale of ["de", "en"]) {
      for (const extension of entry.type === "email"
        ? ["html", "txt"]
        : ["html"]) {
        const body = await read(
          `.cache/previews/${entry.type}/${entry.id}/${locale}-default.${extension}`,
        );
        if (entry.id !== "saml-post-form")
          assert.ok(
            body.trim().length > 20,
            `${entry.id}/${locale}/${extension}`,
          );
        assert.doesNotMatch(
          body,
          /FreeMarker template error|accountTemporarySuspensionBody/,
        );
      }
    }
});
test("default login has both fields and no fixture error; the error variant is separate", async () => {
  const normal = await read(".cache/previews/login/login/de-default.html");
  assert.match(normal, /name="username"/);
  assert.match(normal, /name="password"/);
  assert.doesNotMatch(normal, /E-Mail-Adresse oder Passwort stimmen nicht/);
  assert.match(
    await read(".cache/previews/login/login/de-error.html"),
    /E-Mail-Adresse oder Passwort stimmen nicht/,
  );
});
test("actionable plain-text emails retain their actual action link", async () => {
  for (const id of [
    "password-reset",
    "email-verification",
    "email-update-confirmation",
    "executeActions",
    "identity-provider-link",
    "org-invite",
  ]) {
    const body = await read(`.cache/previews/email/${id}/de-default.txt`);
    assert.match(
      body,
      /https:\/\/login.example.invalid\/action\?key=preview-only/,
      id,
    );
    assert.doesNotMatch(body, /<\/?(?:a|p|h1)\b/);
  }
});
test("shared login layout preserves all upstream authentication logic", async () => {
  const upstream = await read("vendor/keycloak/keycloak.v2/login/template.ftl");
  const theme = await read("themes/velcure/login/template.ftl");
  const normalize = (html) =>
    html
      .replace(
        / {4}<(?:header id="kc-header"|aside class="vc-auth-brand")[\s\S]*?(?= {4}<main )/,
        "<!-- brand header -->",
      )
      .replace(
        /<#if realm\.internationalizationEnabled\s+&& locale\.supported\?size gt 1>[\s\S]*?<\/#if>/,
        "",
      )
      .replace(/ {8}<div class="vc-auth-footer">[\s\S]*?(?= {4}<\/main>)/, "")
      .replace(/\s+/g, " ")
      .trim();
  assert.equal(normalize(theme), normalize(upstream));
});
test("container and preview fixture use the explicitly tested Keycloak version", async () => {
  const config = JSON.parse(await read("keycloak-version.json"));
  assert.match(
    await read("Dockerfile"),
    new RegExp(
      `FROM quay.io/keycloak/keycloak:${config.version.replaceAll(".", "\\.")}`,
    ),
  );
  assert.ok(
    config.themesSha256 && config.vendorSha256 && config.freemarkerSha256,
  );
});
