import { describe, expect, it } from "vitest";
import { parseStoredState } from "../src/lib/persistence";
import { seed } from "../src/lib/seed";

describe("browser persistence validation", () => {
  it("accepts the current demo state", () =>
    expect(parseStoredState(JSON.stringify(seed))).toEqual(seed));

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
});
