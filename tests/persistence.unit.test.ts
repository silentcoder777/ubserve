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
