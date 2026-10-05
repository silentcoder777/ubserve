import { describe, expect, it } from "vitest";
import {
  quote,
  assertSlot,
  availableStartTimes,
  ranked,
  type Booking,
} from "../src/lib/model";
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
  it("offers only start times that fit the duration", () =>
    expect(
      availableStartTimes(p, "2030-01-07", 2, [], new Date(2029, 0, 1)),
    ).toEqual([
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
    ]));
  it("removes overlapping times but keeps adjacent choices", () => {
    const times = availableStartTimes(
      p,
      "2030-01-07",
      1,
      [booking],
      new Date(2029, 0, 1),
    );
    expect(times).toEqual(
      expect.arrayContaining(["08:00", "09:00", "12:00", "17:00"]),
    );
    expect(times).not.toEqual(
      expect.arrayContaining(["10:00", "10:30", "11:00", "11:30"]),
    );
  });
  it("returns no times for unavailable or malformed dates", () => {
    expect(
      availableStartTimes(
        { ...p, days: [] },
        "2030-01-07",
        1,
        [],
        new Date(2029, 0, 1),
      ),
    ).toEqual([]);
    expect(availableStartTimes(p, "not-a-date", 1, [])).toEqual([]);
  });
});
it("balances rating confidence rather than promoting one perfect review", () =>
  expect(
    ranked(
      [{ ...p, id: "new", rating: 5, reviewCount: 1 }, p],
      "recommended",
    )[0].id,
  ).toBe(p.id));
