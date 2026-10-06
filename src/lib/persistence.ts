import { z } from "zod";
import type { State } from "./model";

const account = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(1),
  role: z.enum(["customer", "provider"]),
});

const provider = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  name: z.string().min(1),
  title: z.string(),
  bio: z.string(),
  city: z.string(),
  category: z.enum(["Cleaning", "Cooking", "Auto repair"]),
  priceCents: z.number().int().positive().max(1_000_000),
  pricing: z.enum(["hourly", "fixed"]),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  color: z.string(),
  experience: z.string(),
  days: z.array(z.number().int().min(0).max(6)),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
});

const booking = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  service: z.string().min(1),
  startsAt: z.string().min(1),
  hours: z.number().positive(),
  totalCents: z.number().int().positive(),
  address: z.string(),
  notes: z.string(),
  status: z.enum(["requested", "accepted", "completed", "cancelled"]),
  payment: z.enum(["unpaid", "mock-paid"]),
  paymentReference: z.string().nullable().optional(),
});

const review = z.object({
  id: z.string().min(1),
  bookingId: z.string().min(1),
  customerId: z.string().min(1),
  providerId: z.string().min(1),
  name: z.string().min(1),
  stars: z.number().int().min(1).max(5),
  text: z.string().min(1),
});

const storedState = z
  .object({
    accounts: z.array(account),
    providers: z.array(provider),
    bookings: z.array(booking),
    reviews: z.array(review),
    currentAccountId: z.string().nullable(),
  })
  .superRefine((state, context) => {
    const accounts = new Map(state.accounts.map((item) => [item.id, item]));
    const providers = new Map(state.providers.map((item) => [item.id, item]));
    const bookings = new Map(state.bookings.map((item) => [item.id, item]));

    state.providers.forEach((item, index) => {
      if (accounts.get(item.accountId)?.role !== "provider")
        context.addIssue({
          code: "custom",
          message: "Provider owner is missing or invalid.",
          path: ["providers", index, "accountId"],
        });
    });
    state.bookings.forEach((item, index) => {
      if (accounts.get(item.customerId)?.role !== "customer")
        context.addIssue({
          code: "custom",
          message: "Booking customer is missing or invalid.",
          path: ["bookings", index, "customerId"],
        });
      if (!providers.has(item.providerId))
        context.addIssue({
          code: "custom",
          message: "Booking provider is missing.",
          path: ["bookings", index, "providerId"],
        });
    });
    state.reviews.forEach((item, index) => {
      const relatedBooking = bookings.get(item.bookingId);
      if (
        !relatedBooking ||
        relatedBooking.customerId !== item.customerId ||
        relatedBooking.providerId !== item.providerId
      )
        context.addIssue({
          code: "custom",
          message: "Review references do not match a booking.",
          path: ["reviews", index],
        });
    });
  });

export function parseStoredState(raw: string | null): State | null {
  if (!raw) return null;
  try {
    const result = storedState.safeParse(JSON.parse(raw));
    return result.success ? (result.data as State) : null;
  } catch {
    return null;
  }
}
