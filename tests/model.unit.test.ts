import { describe, expect, it } from "vitest";
import { quote, assertSlot, ranked, type Booking } from "../src/lib/model";
import { seedProviders } from "../src/lib/seed";
const p = seedProviders[0];
const date = new Date(2030, 0, 7, 10); // Local-time availability, independent of test runner timezone.
const booking: Booking = {
  id: "b",
  customerId: "c",
  providerId: p.id,
  providerName: p.name,
  service: p.category,
  startsAt: date.toISOString(),
  hours: 2,
  totalCents: 7000,
  address: "123 Main",
  notes: "",
  status: "requested",
  payment: "unpaid",
};
describe("pricing", () => {
  it("calculates fractional hours in integer cents", () =>
    expect(quote({ ...p, priceCents: 3501 }, 1.5)).toBe(5252));
  it("keeps fixed prices independent of duration", () =>
    expect(quote({ ...p, pricing: "fixed" }, 4)).toBe(3500));
  it.each([0, -1, 9, 1.2, NaN, Infinity])(
    "rejects invalid duration %s",
    (hours) => expect(() => quote(p, hours)).toThrow(),
  );
  it("rejects invalid price", () =>
    expect(() => quote({ ...p, priceCents: -100 }, 2)).toThrow());
});
describe("availability", () => {
  it("blocks overlaps", () =>
    expect(() =>
      assertSlot(
        p,
        new Date(2030, 0, 7, 11).toISOString(),
        1,
        [booking],
        new Date(2029, 0, 1),
      ),
    ).toThrow("reserved"));
  it("allows adjacent bookings", () =>
    expect(() =>
      assertSlot(
        p,
        new Date(2030, 0, 7, 12).toISOString(),
        1,
        [booking],
        new Date(2029, 0, 1),
      ),
    ).not.toThrow());
  it("ignores cancelled reservations", () =>
    expect(() =>
      assertSlot(
        p,
        date.toISOString(),
        1,
        [{ ...booking, status: "cancelled" }],
        new Date(2029, 0, 1),
      ),
    ).not.toThrow());
  it("blocks appointments extending past closing", () =>
    expect(() =>
      assertSlot(
        p,
        new Date(2030, 0, 7, 17).toISOString(),
        2,
        [],
        new Date(2029, 0, 1),
      ),
    ).toThrow("availability"));
  it("blocks unavailable weekdays", () =>
    expect(() =>
      assertSlot(
        { ...p, days: [] },
        date.toISOString(),
        1,
        [],
        new Date(2029, 0, 1),
      ),
    ).toThrow("availability"));
  it("blocks past appointments", () =>
    expect(() =>
      assertSlot(p, date.toISOString(), 1, [], new Date(2031, 0, 1)),
    ).toThrow("future"));
});
it("balances rating confidence rather than promoting one perfect review", () =>
  expect(
    ranked(
      [{ ...p, id: "new", rating: 5, reviewCount: 1 }, p],
      "recommended",
    )[0].id,
  ).toBe(p.id));
