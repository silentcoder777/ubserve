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
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "declined",
  );
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
  await expect(
    page.getByRole("status").filter({ hasText: "Review published" }),
  ).toContainText("Review published");
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
test("search empty state and responsive page fit", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page
    .getByLabel("Search services or providers")
    .fill("zzzz-no-provider");
  await expect(
    page.getByRole("heading", { name: "No providers found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  if (process.env.UBSERVE_SCREENSHOT_DIR)
    await page.screenshot({
      path: `${process.env.UBSERVE_SCREENSHOT_DIR}/ubserve-${testInfo.project.name}.png`,
      fullPage: true,
    });
  await expect(page.getByRole("article")).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("dialogs contain keyboard focus, close with Escape, and restore the opener", async ({
  page,
}) => {
  await page.goto("/");
  const opener = page
    .getByRole("button", { name: "Join / sign in", exact: true })
    .first();
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Make yourself at home" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  const close = dialog.getByRole("button", { name: "Close dialog" });
  await close.focus();
  // Native dialog focus may reach browser chrome at a Tab boundary; it must
  // never reach inert page controls. Test that boundary without requiring
  // a custom wrapping implementation.
  await opener.evaluate((element) => (element as HTMLElement).focus());
  await expect(close).toBeFocused();
  await dialog.getByLabel("Your name").focus();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "I offer a service" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByLabel("Your name")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("dialog backdrop dismissal preserves inside clicks", async ({ page }) => {
  await page.goto("/");
  const opener = page
    .getByRole("button", { name: "Join / sign in", exact: true })
    .first();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Your name").click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("booking form offers only start times that fit the selected duration", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Maya Thompson" }) })
    .getByRole("button", { name: "View & book" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Maya Thompson" });
  await expect(dialog.getByLabel("Start time").locator("option")).toHaveCount(
    17,
  );
  await dialog.getByLabel("Duration").selectOption("8");
  await expect(dialog.getByLabel("Start time").locator("option")).toHaveCount(
    5,
  );
  await expect(dialog.getByLabel("Start time")).toHaveValue("08:00");
});

test("investor preview follows a booking across customer and provider views", async ({
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
  await page
    .getByRole("dialog", { name: "Test checkout" })
    .getByRole("button", { name: "Close dialog" })
    .click();

  await page.getByRole("button", { name: "Switch demo view" }).click();
  await page
    .getByRole("dialog", { name: "Switch demo view" })
    .getByRole("button", { name: "Maya Thompson provider" })
    .click();
  await expect(page.getByRole("heading", { name: "Alex Demo" })).toBeVisible();
  await page.getByRole("button", { name: "Accept request" }).click();

  await page.getByRole("button", { name: "Switch demo view" }).click();
  await page
    .getByRole("dialog", { name: "Switch demo view" })
    .getByRole("button", { name: "Alex Demo customer" })
    .click();
  await expect(page.getByText("accepted", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Previewing Alex Demo" }),
  ).toBeVisible();
});

test("a provider tab receives new customer bookings without a reload", async ({
  page,
  context,
}) => {
  const providerPage = await context.newPage();
  await providerPage.goto("/");
  await providerPage.getByRole("button", { name: "Switch demo view" }).click();
  await providerPage
    .getByRole("dialog", { name: "Switch demo view" })
    .getByRole("button", { name: "Maya Thompson provider" })
    .click();
  await expect(
    providerPage.getByRole("heading", { name: "No bookings yet" }),
  ).toBeVisible();

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
    providerPage.getByRole("heading", { name: "Alex Demo" }),
  ).toBeVisible();
  await expect(
    providerPage.getByText("requested", { exact: true }),
  ).toBeVisible();
  await providerPage.getByRole("button", { name: "Accept request" }).click();
  await page
    .getByRole("dialog", { name: "Test checkout" })
    .getByRole("button", { name: "Close dialog" })
    .click();
  await expect(page.getByText("accepted", { exact: true })).toBeVisible();
});
