import { expect, it, afterEach } from "vitest";
import { POST } from "../src/app/api/mock-checkout/route";
const body = {
  bookingId: "58c4f9a4-5d8a-4f33-9a46-63b8bdd3edb4",
  amountCents: 7000,
  scenario: "success",
};
function req(input: unknown) {
  return new Request("http://localhost/api/mock-checkout", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
afterEach(() => {
  delete process.env.DISABLE_MOCK_PAYMENTS;
});
it("returns a clearly identified mock payment", async () => {
  const res = await POST(req(body));
  expect(res.status).toBe(200);
  const result = await res.json();
  expect(result).toMatchObject({
    bookingId: body.bookingId,
    status: "succeeded",
    mock: true,
    amount: 7000,
    currency: "usd",
  });
  expect(result.id).toMatch(/^mock_pi_[0-9a-f-]{36}$/);
});
it("returns a recoverable declined payment", async () =>
  expect((await POST(req({ ...body, scenario: "decline" }))).status).toBe(402));
it.each([
  {},
  { ...body, amountCents: -1 },
  { ...body, bookingId: "invalid" },
  { ...body, scenario: "real" },
])("rejects invalid checkout input", async (value) =>
  expect((await POST(req(value))).status).toBe(400),
);
it("allows mock checkout to be disabled", async () => {
  process.env.DISABLE_MOCK_PAYMENTS = "true";
  expect((await POST(req(body))).status).toBe(403);
});
