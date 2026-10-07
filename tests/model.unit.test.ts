import { describe, expect, it } from "vitest";
import {
  quote,
  assertSlot,
  availableStartTimes,
  bookingQuoteLabel,
  filterProviders,
  summarizeBookings,
  sortBookingsForDashboard,
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
  it("explains hourly, fixed and legacy booking totals", () => {
    expect(
      bookingQuoteLabel({
        hours: 2,
        pricingSnapshot: "hourly",
        unitPriceCents: 3500,
      }),
    ).toBe("$35/hour × 2 hours");
    expect(
      bookingQuoteLabel({
        hours: 3,
        pricingSnapshot: "fixed",
        unitPriceCents: 8500,
      }),
    ).toBe("$85 fixed price");
    expect(bookingQuoteLabel({ hours: 2 })).toBe("Saved booking total");
  });
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

describe("provider discovery filters", () => {
  it("combines category, text, city, pricing model and maximum price", () => {
    const providers = filterProviders(seedProviders, {
      category: "Cleaning",
      query: "busy",
      city: "ames",
      pricing: "hourly",
      maxPriceCents: 3200,
      availabilityDay: null,
    });
    expect(providers.map((provider) => provider.name)).toEqual([
      "Elena Rodriguez",
    ]);
  });

  it("searches service descriptions and treats blank filters as unbounded", () => {
    const providers = filterProviders(seedProviders, {
      category: "All services",
      query: "vehicle diagnostics",
      city: " ",
      pricing: "all",
      maxPriceCents: null,
      availabilityDay: null,
    });
    expect(providers.map((provider) => provider.name)).toEqual([
      "Jordan Brooks",
    ]);
  });

  it("filters providers by a selected available weekday", () => {
    const providers = filterProviders(
      [
        { ...seedProviders[0], days: [1, 2, 3, 4, 5] },
        { ...seedProviders[1], days: [0, 6] },
      ],
      {
        category: "All services",
        query: "",
        city: "",
        pricing: "all",
        maxPriceCents: null,
        availabilityDay: 0,
      },
    );
    expect(providers.map((provider) => provider.name)).toEqual(["Arjun Patel"]);
  });
});

it("summarizes lifecycle, mock-payment and non-cancelled booking value", () => {
  const summary = summarizeBookings([
    booking,
    {
      ...booking,
      id: "accepted",
      status: "accepted",
      payment: "mock-paid",
      totalCents: 9000,
    },
    {
      ...booking,
      id: "completed",
      status: "completed",
      payment: "mock-paid",
      totalCents: 5000,
    },
    {
      ...booking,
      id: "cancelled",
      status: "cancelled",
      payment: "mock-refunded",
      totalCents: 12000,
    },
  ]);
  expect(summary).toEqual({
    active: 2,
    requested: 1,
    accepted: 1,
    completed: 1,
    cancelled: 1,
    mockPaid: 2,
    bookedValueCents: 21000,
  });
});

it("orders upcoming work first and history newest first", () => {
  const bookings = [
    {
      ...booking,
      id: "completed-older",
      status: "completed" as const,
      startsAt: "2030-01-08T10:00:00.000Z",
    },
    {
      ...booking,
      id: "accepted-later",
      status: "accepted" as const,
      startsAt: "2030-01-12T10:00:00.000Z",
    },
    {
      ...booking,
      id: "cancelled-newer",
      status: "cancelled" as const,
      startsAt: "2030-01-10T10:00:00.000Z",
    },
    {
      ...booking,
      id: "requested-next",
      startsAt: "2030-01-09T10:00:00.000Z",
    },
  ];
  expect(sortBookingsForDashboard(bookings).map((item) => item.id)).toEqual([
    "requested-next",
    "accepted-later",
    "cancelled-newer",
    "completed-older",
  ]);
  expect(bookings.map((item) => item.id)).toEqual([
    "completed-older",
    "accepted-later",
    "cancelled-newer",
    "requested-next",
  ]);
});
