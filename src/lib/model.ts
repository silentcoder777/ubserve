export const categories = [
  "All services",
  "Cleaning",
  "Cooking",
  "Auto repair",
] as const;
export type Category = Exclude<(typeof categories)[number], "All services">;
export type Account = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "provider";
};
export type Provider = {
  id: string;
  accountId: string;
  name: string;
  title: string;
  bio: string;
  city: string;
  category: Category;
  priceCents: number;
  pricing: "hourly" | "fixed";
  rating: number;
  reviewCount: number;
  color: string;
  experience: string;
  days: number[];
  startHour: number;
  endHour: number;
};
export type Booking = {
  id: string;
  customerId: string;
  providerId: string;
  providerName: string;
  service: string;
  startsAt: string;
  hours: number;
  totalCents: number;
  address: string;
  notes: string;
  status: "requested" | "accepted" | "completed" | "cancelled";
  payment: "unpaid" | "mock-paid" | "mock-refunded";
  paymentReference?: string | null;
};
export type Review = {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  name: string;
  stars: number;
  text: string;
};
export type SavedProvider = {
  customerId: string;
  providerId: string;
};
export type State = {
  accounts: Account[];
  providers: Provider[];
  bookings: Booking[];
  reviews: Review[];
  savedProviders: SavedProvider[];
  currentAccountId: string | null;
};
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
export function quote(
  provider: Pick<Provider, "priceCents" | "pricing">,
  hours: number,
) {
  if (
    !Number.isSafeInteger(provider.priceCents) ||
    provider.priceCents <= 0 ||
    provider.priceCents > 1000000
  )
    throw new Error("Enter a valid price.");
  if (!Number.isFinite(hours) || hours < 1 || hours > 8 || hours % 0.5 !== 0)
    throw new Error(
      "Choose a duration between 1 and 8 hours in half-hour increments.",
    );
  return provider.pricing === "hourly"
    ? Math.round(provider.priceCents * hours)
    : provider.priceCents;
}
export function assertSlot(
  provider: Provider,
  startsAt: string,
  hours: number,
  bookings: Booking[],
  now = new Date(),
) {
  quote(provider, hours);
  const start = new Date(startsAt);
  if (!Number.isFinite(start.getTime()) || start <= now)
    throw new Error("Choose a future appointment.");
  // Mock availability uses the browser's local timezone; production will use provider IANA zones.
  if (
    !provider.days.includes(start.getDay()) ||
    start.getHours() + start.getMinutes() / 60 < provider.startHour ||
    start.getHours() + start.getMinutes() / 60 + hours > provider.endHour
  )
    throw new Error("This time is outside the provider’s availability.");
  const end = start.getTime() + hours * 3600000;
  if (
    bookings.some(
      (b) =>
        b.providerId === provider.id &&
        b.status !== "cancelled" &&
        start.getTime() < new Date(b.startsAt).getTime() + b.hours * 3600000 &&
        end > new Date(b.startsAt).getTime(),
    )
  )
    throw new Error("This time is already reserved. Choose another time.");
}
export function availableStartTimes(
  provider: Provider,
  date: string,
  hours: number,
  bookings: Booking[],
  now = new Date(),
) {
  const day = new Date(`${date}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(day.getTime()))
    return [];

  const times: string[] = [];
  for (
    let minutes = provider.startHour * 60;
    minutes + hours * 60 <= provider.endHour * 60;
    minutes += 30
  ) {
    const start = new Date(day);
    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    try {
      assertSlot(provider, start.toISOString(), hours, bookings, now);
      times.push(
        `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
      );
    } catch {
      // Invalid or reserved times are omitted from customer choices.
    }
  }
  return times;
}
export type ProviderFilters = {
  category: (typeof categories)[number];
  query: string;
  city: string;
  pricing: "all" | Provider["pricing"];
  maxPriceCents: number | null;
};
export function filterProviders(
  providers: Provider[],
  filters: ProviderFilters,
) {
  const query = filters.query.trim().toLowerCase();
  const city = filters.city.trim().toLowerCase();
  return providers.filter(
    (provider) =>
      (filters.category === "All services" ||
        provider.category === filters.category) &&
      (!query ||
        `${provider.name} ${provider.title} ${provider.category} ${provider.bio}`
          .toLowerCase()
          .includes(query)) &&
      (!city || provider.city.toLowerCase().includes(city)) &&
      (filters.pricing === "all" || provider.pricing === filters.pricing) &&
      (filters.maxPriceCents === null ||
        provider.priceCents <= filters.maxPriceCents),
  );
}
export function summarizeBookings(bookings: Booking[]) {
  return bookings.reduce(
    (summary, booking) => {
      summary[booking.status] += 1;
      if (booking.status === "requested" || booking.status === "accepted")
        summary.active += 1;
      if (booking.status !== "cancelled") {
        summary.bookedValueCents += booking.totalCents;
        if (booking.payment === "mock-paid") summary.mockPaid += 1;
      }
      return summary;
    },
    {
      active: 0,
      requested: 0,
      accepted: 0,
      completed: 0,
      cancelled: 0,
      mockPaid: 0,
      bookedValueCents: 0,
    },
  );
}
export function ranked(providers: Provider[], sort: string) {
  return [...providers].sort((a, b) =>
    sort === "price"
      ? a.priceCents - b.priceCents
      : (b.reviewCount * b.rating + 10 * 4.5) / (b.reviewCount + 10) -
        (a.reviewCount * a.rating + 10 * 4.5) / (a.reviewCount + 10),
  );
}
