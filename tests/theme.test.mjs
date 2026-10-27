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
  const images = [
    ...(await read("Dockerfile")).matchAll(
      /^FROM quay\.io\/keycloak\/keycloak:(\S+)/gm,
    ),
  ];
  assert.ok(images.length > 0);
  for (const [, version] of images) assert.equal(version, config.version);
  assert.ok(
    config.themesSha256 && config.vendorSha256 && config.freemarkerSha256,
  );
});

test("Account Console extends the native application without replacing its authentication runtime", async () => {
  const properties = await read("themes/velcure/account/theme.properties");
  assert.match(properties, /^parent=keycloak\.v3$/m);
  assert.doesNotMatch(properties, /^scripts=/m);
  const fixture = JSON.parse(await read("fixtures/realm/velcure-preview.json"));
  assert.equal(fixture.accountTheme, "velcure");
  assert.ok(
    fixture.users[0].realmRoles.includes("default-roles-velcure-preview"),
  );
  assert.match(
    await read("scripts/build-theme.mjs"),
    /"login", "email", "account"/,
  );
});

test("Account visual fixtures are versioned, token-free and use only isolated assets", async () => {
  const config = JSON.parse(await read("keycloak-version.json"));
  const metadata = JSON.parse(await read("fixtures/account/metadata.json"));
  assert.equal(metadata.keycloak, config.version);
  assert.equal(metadata.accountSha256, config.accountSha256);
  const pages = JSON.parse(await read("src/lib/account-pages.json"));
  for (const page of pages)
    for (const locale of ["de", "en"]) {
      const fixture = await read(`fixtures/account/${locale}/${page.id}.html`);
      assert.match(fixture, /data-testid="page-heading"/);
      assert.doesNotMatch(
        fixture,
        /<script\b|session_state=|session_code=|access_token|id_token|127\.0\.0\.1:8082/,
      );
      const preview = await read(
        `.cache/previews/account/${page.id}/${locale}-default.html`,
      );
      assert.match(
        preview,
        /\/theme-resources\/account\/css\/velcure-account\.css/,
      );
      assert.match(preview, /data-account-preview/);
    }
  for (const locale of ["de", "en"]) {
    const methods = await read(`fixtures/account/${locale}/signing-in.html`);
    assert.match(methods, /two-factor-categ-title/);
    assert.match(methods, /passwordless-categ-title/);
  }
});
test("registration keeps an invited address fixed, only while it matches login_hint", async () => {
  const body = await read(".cache/previews/login/register/de-default.html");
  assert.match(body, /get\("login_hint"\)/);
  assert.match(body, /email\.readOnly = true/);
  assert.match(body, /Die Adresse kommt aus deiner Einladung/);
});

test("registration offers the sign-in when the address has an account already", async () => {
  const error = await read(".cache/previews/login/register/de-error.html");
  assert.match(error, /id="vc-email-exists-login"/);
  assert.match(error, /Mit dieser Adresse anmelden/);
  const errorEn = await read(".cache/previews/login/register/en-error.html");
  assert.match(errorEn, /Sign in with this address/);
  const plain = await read(".cache/previews/login/register/de-default.html");
  assert.doesNotMatch(plain, /vc-email-exists/);
});
