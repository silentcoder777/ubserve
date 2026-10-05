import { test, expect, type Page } from "@playwright/test";
async function account(
  page: Page,
  name: string,
  email: string,
  provider = false,
) {
  await page
    .getByRole("button", { name: "Join / sign in", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  if (provider)
    await dialog.getByRole("button", { name: "I offer a service" }).click();
  await dialog.getByLabel("Your name").fill(name);
  await dialog.getByLabel("Demo email").fill(email);
  await dialog
    .getByRole("button", {
      name: `Continue as ${provider ? "provider" : "customer"}`,
    })
    .click();
}
async function bookings(page: Page) {
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole("button", { name: /My bookings/ }).click();
}
test("customer books, tests decline/success, provider completes, customer reviews", async ({
  page,
}) => {
  await page.goto("/");
  await account(page, "Alex Demo", "alex@example.test");
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Maya Thompson" }) })
    .getByRole("button", { name: "View & book" })
    .click();
  await page.getByLabel("Service address").fill("123 Main Street, Ames, IA");
  await page.getByRole("button", { name: "Request booking" }).click();
  await expect(
    page.getByRole("dialog", { name: "Test checkout" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Test declined payment" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("declined");
  await page.getByRole("button", { name: /Simulate payment/ }).click();
  await expect(
    page.getByText("Test payment complete", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await account(page, "Maya Thompson", "p1@example.test", true);
  await bookings(page);
  await page.getByRole("button", { name: "Accept request" }).click();
  await page.getByRole("button", { name: "Mark complete" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await account(page, "Alex Demo", "alex@example.test");
  await bookings(page);
  await page.getByRole("button", { name: "Leave a review" }).click();
  await page
    .getByLabel("Your review")
    .fill("Great service and excellent attention to detail.");
  await page.getByRole("button", { name: "Publish review" }).click();
  await expect(page.getByRole("status").filter({hasText:"Review published"})).toContainText("Review published");
  await page.reload();
  await bookings(page);
  await expect(page.getByText("completed", { exact: true })).toBeVisible();
});
test("provider publishes fixed-price profile and discovery survives reload", async ({
  page,
}) => {
  await page.goto("/");
  await account(page, "Taylor Demo", "taylor@example.test", true);
  await page
    .getByLabel("Profile headline")
    .fill("Careful cleaning for your home");
  await page
    .getByLabel("About your service")
    .fill("A fixed-price cleaning visit with supplies included.");
  await page.getByLabel("Pricing type").selectOption("fixed");
  await page.getByLabel("Price (USD)").fill("99");
  await page.getByRole("button", { name: "Publish profile" }).click();
  await page.getByRole("button", { name: "Ubserve home" }).click();
  await page.getByLabel("Search services or providers").fill("Taylor");
  await expect(
    page.getByRole("heading", { name: "Taylor Demo" }),
  ).toBeVisible();
  await expect(page.getByText("$99", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByLabel("Search services or providers").fill("Taylor");
  await expect(
    page.getByRole("heading", { name: "Taylor Demo" }),
  ).toBeVisible();
});
test("search empty state and responsive page fit", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("Search services or providers")
    .fill("zzzz-no-provider");
  await expect(
    page.getByRole("heading", { name: "No providers found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("article")).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
