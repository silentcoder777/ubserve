import { describe, expect, it } from "vitest";
import { parseStoredState } from "../src/lib/persistence";
import { seed } from "../src/lib/seed";

describe("browser persistence validation", () => {
  it("accepts the current demo state", () =>
    expect(parseStoredState(JSON.stringify(seed))).toEqual(seed));

  it("migrates older demo snapshots with an empty saved-provider list", () => {
    const legacy = JSON.parse(JSON.stringify(seed));
    delete legacy.savedProviders;
    expect(parseStoredState(JSON.stringify(legacy))).toEqual(seed);
  });

  it("accepts a cancelled booking with a retained mock refund reference", () => {
    const customer = {
      id: "customer-1",
      name: "Alex Demo",
      email: "alex@example.test",
      role: "customer" as const,
    };
    const refunded = {
      ...seed,
      accounts: [...seed.accounts, customer],
      bookings: [
        {
          id: "booking-1",
          customerId: customer.id,
          providerId: seed.providers[0].id,
          providerName: seed.providers[0].name,
          service: seed.providers[0].category,
          startsAt: "2030-01-07T16:00:00.000Z",
          hours: 2,
          totalCents: 7000,
          pricingSnapshot: "hourly" as const,
          unitPriceCents: 3500,
          address: "123 Main Street",
          notes: "",
          status: "cancelled" as const,
          payment: "mock-refunded" as const,
          paymentReference: "mock_pay_demo",
        },
      ],
    };
    expect(parseStoredState(JSON.stringify(refunded))).toEqual(refunded);
  });

  it("rejects an incomplete or inconsistent booking quote snapshot", () => {
    const customer = {
      id: "customer-1",
      name: "Alex Demo",
      email: "alex@example.test",
      role: "customer" as const,
    };
    const booking = {
      id: "booking-1",
      customerId: customer.id,
      providerId: seed.providers[0].id,
      providerName: seed.providers[0].name,
      service: seed.providers[0].category,
      startsAt: "2030-01-07T16:00:00.000Z",
      hours: 2,
      totalCents: 7000,
      address: "123 Main Street",
      notes: "",
      status: "requested" as const,
      payment: "unpaid" as const,
    };
    const state = {
      ...seed,
      accounts: [...seed.accounts, customer],
      bookings: [{ ...booking, pricingSnapshot: "hourly" as const }],
    };
    expect(parseStoredState(JSON.stringify(state))).toBeNull();
    expect(
      parseStoredState(
        JSON.stringify({
          ...state,
          bookings: [
            {
              ...booking,
              pricingSnapshot: "hourly",
              unitPriceCents: 4000,
            },
          ],
        }),
      ),
    ).toBeNull();
  });

  it.each([null, "", "not-json", JSON.stringify({ accounts: [] })])(
    "rejects missing or malformed snapshots",
    (raw) => expect(parseStoredState(raw)).toBeNull(),
  );

  it("rejects invalid nested provider fields", () => {
    const invalid = {
      ...seed,
      providers: [{ ...seed.providers[0], priceCents: "35.00" }],
    };
    expect(parseStoredState(JSON.stringify(invalid))).toBeNull();
  });

  it("rejects broken relationships", () => {
    const invalid = {
      ...seed,
      providers: [{ ...seed.providers[0], accountId: "missing-account" }],
    };
    expect(parseStoredState(JSON.stringify(invalid))).toBeNull();
  });

  it("rejects invalid or duplicate saved-provider relationships", () => {
    const invalidCustomer = {
      ...seed,
      savedProviders: [{ customerId: "a1", providerId: "p1" }],
    };
    expect(parseStoredState(JSON.stringify(invalidCustomer))).toBeNull();

    const customer = {
      id: "customer-1",
      name: "Alex Demo",
      email: "alex@example.test",
      role: "customer" as const,
    };
    const duplicate = {
      ...seed,
      accounts: [...seed.accounts, customer],
      savedProviders: [
        { customerId: customer.id, providerId: "p1" },
        { customerId: customer.id, providerId: "p1" },
      ],
    };
    expect(parseStoredState(JSON.stringify(duplicate))).toBeNull();
  });
});
