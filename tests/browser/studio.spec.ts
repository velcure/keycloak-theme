import { expect, test } from "@playwright/test";

test("SSR studio navigation and variants work without client JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4322/preview/login/login");
  await expect(
    page.getByRole("heading", { name: "Anmelden · kombiniert", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Passwort vergessen", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Passwort vergessen", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/locale=en/);
  await context.close();
});
test("native password visibility works and assets load", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/render/login/login");
  await expect(
    page.getByLabel("E-Mail-Adresse", { exact: true }),
  ).toBeVisible();
  const password = page.locator("#password");
  await expect(password).toHaveAttribute("type", "password");
  await page.locator("#password-show-password").click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(page.locator(".vc-auth-logo")).not.toHaveJSProperty(
    "naturalWidth",
    0,
  );
  expect(errors).toEqual([]);
});
test("mobile login fits without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/render/login/login");
  await expect(
    page.getByRole("button", { name: "Anmelden", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("email preview supports plaintext and HTML", async ({ page }) => {
  await page.goto("/preview/email/password-reset");
  await expect(
    page
      .frameLocator("iframe")
      .getByRole("heading", { name: "Ein neues Passwort für dich." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Text", exact: true }).click();
  await expect(
    page.frameLocator("iframe").getByText(/https:\/\/login.example.invalid/),
  ).toBeVisible();
});
