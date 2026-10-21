import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

const pages: { id: string; path: string }[] = JSON.parse(
  readFileSync("src/lib/account-pages.json", "utf8"),
);

const base = "/realms/velcure-preview/account/";
async function login(page: Page) {
  await page.goto(base);
  await page.locator("#username").fill("alex@beispiel.invalid");
  await page.locator("#kc-login").click();
  await page.locator("#password").fill("preview-only-change-me");
  await page.locator("#kc-login").click();
  await expect(page.getByTestId("page-heading")).toBeVisible();
}

test("native account routes load with Velcure assets and working API authorization", async ({
  page,
}) => {
  const failed: string[] = [];
  page.on("response", (response) => {
    if (
      response.url().includes("/realms/velcure-preview/account/") &&
      response.status() >= 400
    )
      failed.push(`${response.status()} ${response.url()}`);
  });
  await login(page);
  const frame = await page
    .locator(".pf-v5-c-page__sidebar")
    .evaluate((element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: box.x,
        y: box.y,
        bottom: innerHeight - box.bottom,
        radii: [
          style.borderTopLeftRadius,
          style.borderTopRightRadius,
          style.borderBottomLeftRadius,
          style.borderBottomRightRadius,
        ],
      };
    });
  expect(frame.x).toBe(12);
  expect(frame.y).toBe(12);
  expect(frame.bottom).toBe(12);
  expect(frame.radii).toEqual(["28px", "28px", "28px", "28px"]);
  await page.locator("#nav-toggle").click();
  await expect(page.locator("#nav-toggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.locator("#nav-toggle").click();
  await expect(page.locator("#nav-toggle")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  for (const entry of pages) {
    await page.goto(`${base}${entry.path}`);
    await expect(page.getByTestId("page-heading")).toBeVisible();
    await expect(page.locator(".pf-v5-c-masthead__brand img")).toHaveJSProperty(
      "naturalWidth",
      176,
    );
    await expect(
      page.getByText("Ein Fehler ist aufgetreten", { exact: true }),
    ).toHaveCount(0);
    expect(
      await page
        .locator(".pf-v5-c-page__sidebar")
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).toBe("rgb(3, 47, 46)");
  }
  expect(failed).toEqual([]);
});

test("profile saves through the real Account API and persists across reload", async ({
  page,
}) => {
  await login(page);
  await page.locator("#firstName").fill("Alex Preview");
  await page.locator("#save-btn").click();
  await expect(
    page.getByText("Dein Konto wurde aktualisiert.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("#firstName")).toHaveValue("Alex Preview");
  await page.locator("#firstName").fill("Alex");
  await page.locator("#save-btn").click();
  await expect(
    page.getByText("Dein Konto wurde aktualisiert.", { exact: true }),
  ).toBeVisible();
});

test("password, OTP and passkey setup use native required-action flows", async ({
  page,
}) => {
  await login(page);
  await page.goto(`${base}account-security/signing-in`);
  await expect(
    page.getByRole("heading", { name: "Passwortlos", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Aktualisieren", exact: true })
    .click();
  await expect(page.locator("#password-new")).toBeVisible();
  await expect(page.locator("#password-confirm")).toBeVisible();
  // Do not change credentials: the purpose is to verify native action handoff.
  await page.goto(`${base}account-security/signing-in`);
  await page
    .getByRole("button", { name: "Passkey einrichten", exact: true })
    .first()
    .click();
  await expect(page.locator("#registerWebAuthn")).toBeVisible();
  await page.goto(`${base}account-security/signing-in`);
  await page
    .getByRole("button", {
      name: "Authenticator-Anwendung einrichten",
      exact: true,
    })
    .click();
  await expect(page.locator("#totp")).toBeVisible();
  await expect(page.locator("#kc-totp-secret-qr-code")).toBeVisible();
});

test("native mobile navigation works and account pages fit a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  for (const entry of pages) {
    await page.goto(`${base}${entry.path}`);
    await expect(page.getByTestId("page-heading")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.locator("#nav-toggle").click();
  await expect(page.locator("#nav-toggle")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  const drawer = await page
    .locator(".pf-v5-c-page__sidebar")
    .evaluate((element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: box.x,
        y: box.y,
        right: innerWidth - box.right,
        bottom: innerHeight - box.bottom,
        radius: style.borderRadius,
      };
    });
  expect(drawer.x).toBe(12);
  expect(drawer.y).toBe(96);
  expect(drawer.right).toBeGreaterThanOrEqual(12);
  expect(drawer.bottom).toBe(12);
  expect(drawer.radius).toBe("28px");
  await expect(
    page.getByRole("link", { name: "Persönliche Angaben", exact: true }),
  ).toBeVisible();
});
