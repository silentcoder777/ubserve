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
  await page
    .getByLabel("Anything the provider should know? (optional)")
    .fill("Please focus on the kitchen.");
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
  const customerCard = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Maya Thompson" }) });
  await expect(customerCard.getByText("Next up", { exact: true })).toBeVisible();
  await expect(
    customerCard
      .getByRole("list", { name: "Booking progress" })
      .locator('[aria-current="step"]'),
  ).toHaveText("Requested");
  await expect(
    page.getByText("$35/hour × 2 hours", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View test receipt" }).click();
  const receipt = page.getByRole("dialog", { name: "Test payment receipt" });
  await expect(receipt.getByText("$70", { exact: true })).toBeVisible();
  await expect(receipt.getByText("Succeeded (simulated)")).toBeVisible();
  await expect(receipt).toContainText("$35/hour × 2 hours");
  await expect(receipt.getByText(/^mock_pi_/)).toBeVisible();
  await receipt.getByRole("button", { name: "Done" }).click();
  await page.reload();
  await bookings(page);
  await page.getByRole("button", { name: "View test receipt" }).click();
  await expect(
    page.getByRole("dialog", { name: "Test payment receipt" }),
  ).toContainText("No real charge or refund occurred");
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await account(page, "Maya Thompson", "p1@example.test", true);
  await bookings(page);
  const providerCard = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Alex Demo" }) });
  await expect(providerCard.getByText("Next up", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Accept request" }).click();
  await expect(
    providerCard
      .getByRole("list", { name: "Booking progress" })
      .locator('[aria-current="step"]'),
  ).toHaveText("Accepted");
  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(
    providerCard
      .getByRole("list", { name: "Booking progress" })
      .locator('[aria-current="step"]'),
  ).toHaveText("Completed");
  await expect(providerCard.getByText("Next up", { exact: true })).toHaveCount(
    0,
  );
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
  await page.getByRole("button", { name: "View your review" }).click();
  const savedReview = page.getByRole("dialog", {
    name: "Completed service review",
  });
  await expect(
    savedReview.getByLabel("5 out of 5 stars"),
  ).toBeVisible();
  await expect(savedReview).toContainText(
    "Great service and excellent attention to detail.",
  );
  await savedReview.getByRole("button", { name: "Done" }).click();

  await page.getByRole("button", { name: "Book again" }).click();
  const rebook = page.getByRole("dialog", { name: "Maya Thompson" });
  await expect(rebook.getByLabel("Service address")).toHaveValue(
    "123 Main Street, Ames, IA",
  );
  await expect(
    rebook.getByLabel("Anything the provider should know? (optional)"),
  ).toHaveValue("Please focus on the kitchen.");
  await expect(rebook).toContainText("$70");
  await rebook.getByRole("button", { name: "Close dialog" }).click();

  await page.getByRole("button", { name: "Switch demo view" }).click();
  await page
    .getByRole("dialog", { name: "Switch demo view" })
    .getByRole("button", { name: "Maya Thompson provider" })
    .click();
  await page.getByRole("button", { name: "View customer review" }).click();
  await expect(
    page.getByRole("dialog", { name: "Completed service review" }),
  ).toContainText("Alex Demo");
});
test("provider publishes fixed-price profile and discovery survives reload", async ({
  page,
}) => {
  await page.goto("/");
  await account(page, "Taylor Demo", "taylor@example.test", true);
  await page.getByLabel("Display name").fill("Taylor Services");
  await page
    .getByLabel("Profile headline")
    .fill("Careful cleaning for your home");
  await page
    .getByLabel("About your service")
    .fill("A fixed-price cleaning visit with supplies included.");
  await page.getByLabel("Pricing type").selectOption("fixed");
  await page.getByLabel("Price (USD)").fill("99");
  await page.getByRole("button", { name: "Publish profile" }).click();
  await page.getByRole("button", { name: "Switch demo view" }).click();
  const switcher = page.getByRole("dialog", { name: "Switch demo view" });
  await expect(
    switcher.getByRole("button", { name: "Taylor Services provider" }),
  ).toBeVisible();
  await switcher.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Ubserve home" }).click();
  await page.getByLabel("Search services or providers").fill("Taylor");
  await expect(
    page.getByRole("heading", { name: "Taylor Services" }),
  ).toBeVisible();
  await expect(
    page.getByRole("article").filter({ hasText: "Taylor Services" }),
  ).toContainText("Weekdays · 8 AM–6 PM local");
  await page.getByLabel("Available day").selectOption({ label: "Sunday" });
  await expect(
    page.getByRole("heading", { name: "No providers found" }),
  ).toBeVisible();
  await page.getByLabel("Available day").selectOption({ label: "Monday" });
  await expect(
    page.getByRole("heading", { name: "Taylor Services" }),
  ).toBeVisible();
  await expect(page.getByText("$99", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByLabel("Search services or providers").fill("Taylor");
  await expect(
    page.getByRole("heading", { name: "Taylor Services" }),
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

test("discovery combines pricing model and maximum price filters", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Pricing model").selectOption("fixed");
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(
    page.getByRole("heading", { name: "Jordan Brooks" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Chris Anderson" }),
  ).toBeVisible();

  await page.getByLabel("Maximum listed price").selectOption("7500");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Chris Anderson" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(page.getByLabel("Available day")).toHaveValue("any");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("customer saves providers and filters discovery after reload", async ({
  page,
}) => {
  await page.goto("/");
  await account(page, "Saved Demo", "saved@example.test");
  await page.getByRole("button", { name: "Save Maya Thompson" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Maya Thompson saved" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Remove Maya Thompson from saved providers",
    }),
  ).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Saved (1)" }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Maya Thompson" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Remove Maya Thompson from saved providers",
    })
    .click();
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

test("malformed saved data recovers to the safe demo seed", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "ubserve-demo-v1",
      JSON.stringify({
        accounts: [],
        providers: [{ name: 42 }],
        bookings: [],
        reviews: [],
        currentAccountId: null,
      }),
    ),
  );
  await page.reload();

  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "Maya Thompson" }),
  ).toBeVisible();
});

test("booking dashboard filters appointments by lifecycle status", async ({
  page,
}) => {
  await page.goto("/");
  await account(page, "Alex Demo", "alex@example.test");

  for (const provider of ["Maya Thompson", "Arjun Patel"]) {
    await page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: provider }) })
      .getByRole("button", { name: "View & book" })
      .click();
    await page.getByLabel("Service address").fill("123 Main Street, Ames, IA");
    await page.getByRole("button", { name: "Request booking" }).click();
    const checkout = page.getByRole("dialog", { name: "Test checkout" });
    if (provider === "Maya Thompson") {
      await checkout
        .getByRole("button", { name: /Simulate payment/ })
        .click();
      await expect(
        page.getByRole("status").filter({ hasText: "Test payment succeeded" }),
      ).toBeVisible();
    } else {
      await checkout.getByRole("button", { name: "Close dialog" }).click();
    }
    if (provider === "Maya Thompson")
      await page.getByRole("button", { name: "Ubserve home" }).click();
  }

  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Maya Thompson" }) })
    .getByRole("button", { name: "Cancel" })
    .click();
  const cancellation = page.getByRole("dialog", {
    name: "Cancel this booking?",
  });
  await expect(cancellation).toContainText("Cleaning with Maya Thompson");
  await expect(cancellation).toContainText("simulated refund");
  await cancellation.getByRole("button", { name: "Keep booking" }).click();
  await expect(
    page.getByRole("button", { name: "Requested 2" }),
  ).toBeVisible();
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Maya Thompson" }) })
    .getByRole("button", { name: "Cancel" })
    .click();
  await page
    .getByRole("dialog", { name: "Cancel this booking?" })
    .getByRole("button", { name: "Cancel booking" })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "test refund was recorded" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "All 2" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Requested 1" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancelled 1" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Requested 1" }).click();
  await expect(page.getByRole("heading", { name: "Arjun Patel" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Maya Thompson" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Cancelled 1" }).click();
  await expect(
    page.getByRole("heading", { name: "Maya Thompson" }),
  ).toBeVisible();
  await expect(page.getByText("Test refund recorded")).toBeVisible();
  await expect(
    page
      .getByRole("list", { name: "Booking progress" })
      .locator('[aria-current="step"]'),
  ).toHaveText("Cancelled · time released");
  await page.getByRole("button", { name: "View test receipt" }).click();
  const receipt = page.getByRole("dialog", { name: "Test payment receipt" });
  await expect(receipt).toContainText("Simulated refund recorded");
  await expect(receipt).toContainText("Refunded (simulated)");
  await expect(receipt).toContainText("No real charge or refund occurred");
  await receipt.getByRole("button", { name: "Done" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("provider explicitly confirms declining a booking request", async ({
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
  await page.getByRole("button", { name: "Decline" }).click();
  const decline = page.getByRole("dialog", {
    name: "Decline this request?",
  });
  await expect(decline).toContainText("Cleaning with Alex Demo");
  await decline.getByRole("button", { name: "Decline request" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Request declined" }),
  ).toBeVisible();
  await expect(page.getByText("cancelled", { exact: true })).toBeVisible();
});

test("booking summaries stay scoped to the active customer or provider", async ({
  page,
}) => {
  await page.goto("/");
  await account(page, "Alex Demo", "alex@example.test");

  for (const provider of ["Maya Thompson", "Arjun Patel"]) {
    await page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: provider }) })
      .getByRole("button", { name: "View & book" })
      .click();
    await page.getByLabel("Service address").fill("123 Main Street, Ames, IA");
    await page.getByRole("button", { name: "Request booking" }).click();
    if (provider === "Arjun Patel")
      await page.getByRole("button", { name: /Simulate payment/ }).click();
    else {
      await page
        .getByRole("dialog", { name: "Test checkout" })
        .getByRole("button", { name: "Close dialog" })
        .click();
      await page.getByRole("button", { name: "Ubserve home" }).click();
    }
  }

  const customerSummary = page.getByRole("region", {
    name: "Booking summary",
  });
  await expect(
    customerSummary.getByRole("article", { name: "Active bookings: 2" }),
  ).toBeVisible();
  await expect(
    customerSummary.getByRole("article", { name: "Mock paid: 1" }),
  ).toBeVisible();
  await expect(
    customerSummary.getByRole("article", { name: "Booked value: $160" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Switch demo view" }).click();
  await page
    .getByRole("dialog", { name: "Switch demo view" })
    .getByRole("button", { name: "Maya Thompson provider" })
    .click();
  const providerSummary = page.getByRole("region", {
    name: "Booking summary",
  });
  await expect(
    providerSummary.getByRole("article", { name: "New requests: 1" }),
  ).toBeVisible();
  await expect(
    providerSummary.getByRole("article", { name: "Pipeline value: $70" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("customer reschedules a requested booking and refreshes its mock quote", async ({
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
  await page.getByRole("button", { name: /Simulate payment/ }).click();
  await expect(
    page.getByText("Test payment complete", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Reschedule" }).click();
  const dialog = page.getByRole("dialog", {
    name: "Reschedule Maya Thompson",
  });
  await dialog.getByLabel("New duration").selectOption("1.5");
  await dialog.getByLabel("New start time").selectOption("09:30");
  await expect(dialog.getByText("$52.50", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Save new time" }).click();

  await expect(
    page.getByRole("status").filter({ hasText: "mock payment was reset" }),
  ).toBeVisible();
  await expect(page.getByText("Not paid", { exact: true })).toBeVisible();
  await expect(page.getByText("1.5 hours", { exact: true })).toBeVisible();
  await expect(
    page.getByText("$35/hour × 1.5 hours", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Switch demo view" }).click();
  await page
    .getByRole("dialog", { name: "Switch demo view" })
    .getByRole("button", { name: "Maya Thompson provider" })
    .click();
  await expect(page.getByRole("heading", { name: "Alex Demo" })).toBeVisible();
  await expect(page.getByText("1.5 hours", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Alex Demo" }) })
      .getByText("$52.50", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("$35/hour × 1.5 hours", { exact: true }),
  ).toBeVisible();
});
