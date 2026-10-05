"use client";
import { useSyncExternalStore } from "react";
import { seed } from "./seed";
import { parseStoredState } from "./persistence";
import {
  assertSlot,
  quote,
  type Account,
  type Booking,
  type Provider,
  type State,
} from "./model";
const KEY = "ubserve-demo-v1";
const ACCOUNT_KEY = "ubserve-demo-account-v1";
let snapshot: State = seed;
let initialized = false;
const listeners = new Set<() => void>();
function hydrate() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const stored = parseStoredState(localStorage.getItem(KEY)) ?? seed;
    // Fall back to the old shared field once when migrating existing demo data.
    const accountId =
      sessionStorage.getItem(ACCOUNT_KEY) ?? stored.currentAccountId;
    const validAccountId = stored.accounts.some(
      (account) => account.id === accountId,
    )
      ? accountId
      : null;
    snapshot = { ...stored, currentAccountId: validAccountId };
    if (validAccountId) sessionStorage.setItem(ACCOUNT_KEY, validAccountId);
    else sessionStorage.removeItem(ACCOUNT_KEY);
  } catch {
    /* Keep demo usable when browser storage is unavailable. */
  }
}
function getSnapshot() {
  hydrate();
  return snapshot;
}
function publish(next: State) {
  try {
    // Marketplace data is shared by same-profile tabs; active identity is not.
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...next, currentAccountId: null }),
    );
    if (next.currentAccountId)
      sessionStorage.setItem(ACCOUNT_KEY, next.currentAccountId);
    else sessionStorage.removeItem(ACCOUNT_KEY);
  } catch {
    throw new Error(
      "Your browser cannot save demo data. Enable local storage and try again.",
    );
  }
  snapshot = next;
  listeners.forEach((l) => l());
}
export function useDemo() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const syncTab = (event: StorageEvent) => {
        if (event.key !== KEY) return;
        const next = parseStoredState(event.newValue);
        if (!next) return;
        const currentAccountId = next.accounts.some(
          (account) => account.id === snapshot.currentAccountId,
        )
          ? snapshot.currentAccountId
          : null;
        snapshot = { ...next, currentAccountId };
        if (!currentAccountId) sessionStorage.removeItem(ACCOUNT_KEY);
        initialized = true;
        cb();
      };
      window.addEventListener("storage", syncTab);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", syncTab);
      };
    },
    getSnapshot,
    () => seed,
  );
}
export function currentAccount() {
  return getSnapshot().accounts.find((a) => a.id === snapshot.currentAccountId);
}
export function enterDemo(name: string, email: string, role: Account["role"]) {
  const s = getSnapshot();
  email = email.trim().toLowerCase();
  name = name.trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter your name and a valid email address.");
  const existing = s.accounts.find((a) => a.email === email);
  if (existing && existing.role !== role)
    throw new Error(
      "This demo email already has a different role. Use another email.",
    );
  const account = existing ?? { id: crypto.randomUUID(), name, email, role };
  publish({
    ...s,
    accounts: existing ? s.accounts : [...s.accounts, account],
    currentAccountId: account.id,
  });
}
export function signOut() {
  publish({ ...getSnapshot(), currentAccountId: null });
}
export function switchDemoAccount(accountId: string) {
  const s = getSnapshot();
  const account = s.accounts.find((candidate) => candidate.id === accountId);
  if (!account) throw new Error("Demo account not found.");
  publish({ ...s, currentAccountId: account.id });
  return account;
}
export function saveProvider(
  input: Omit<
    Provider,
    "id" | "accountId" | "rating" | "reviewCount" | "color"
  >,
) {
  const s = getSnapshot(),
    a = currentAccount();
  if (!a || a.role !== "provider")
    throw new Error("Open a provider account first.");
  quote(input, 1);
  if (
    !input.name.trim() ||
    !input.title.trim() ||
    !input.bio.trim() ||
    !input.city.trim() ||
    !input.days.length ||
    input.startHour >= input.endHour
  )
    throw new Error("Complete your profile and choose valid availability.");
  const old = s.providers.find((p) => p.accountId === a.id);
  const provider: Provider = {
    ...input,
    id: old?.id ?? crypto.randomUUID(),
    accountId: a.id,
    rating: old?.rating ?? 0,
    reviewCount: old?.reviewCount ?? 0,
    color: old?.color ?? "blue",
  };
  publish({
    ...s,
    providers: old
      ? s.providers.map((p) => (p.id === old.id ? provider : p))
      : [...s.providers, provider],
  });
}
export function requestBooking(
  providerId: string,
  startsAt: string,
  hours: number,
  address: string,
  notes: string,
) {
  const s = getSnapshot(),
    a = currentAccount();
  if (!a || a.role !== "customer")
    throw new Error("Open a customer account to book.");
  const p = s.providers.find((p) => p.id === providerId);
  if (!p) throw new Error("Provider not found.");
  if (address.trim().length < 5) throw new Error("Enter the service address.");
  assertSlot(p, startsAt, hours, s.bookings);
  const booking: Booking = {
    id: crypto.randomUUID(),
    customerId: a.id,
    providerId: p.id,
    providerName: p.name,
    service: p.category,
    startsAt: new Date(startsAt).toISOString(),
    hours,
    totalCents: quote(p, hours),
    address: address.trim(),
    notes: notes.trim(),
    status: "requested",
    payment: "unpaid",
  };
  publish({ ...s, bookings: [booking, ...s.bookings] });
  return booking;
}
export function updateBooking(id: string, status: Booking["status"]) {
  const s = getSnapshot(),
    a = currentAccount(),
    b = s.bookings.find((b) => b.id === id);
  if (!a || !b) throw new Error("Booking not found.");
  const ownsProvider = s.providers.some(
    (p) => p.id === b.providerId && p.accountId === a.id,
  );
  const allowed =
    status === "cancelled"
      ? (ownsProvider || b.customerId === a.id) &&
        ["requested", "accepted"].includes(b.status)
      : ownsProvider &&
        (status === "accepted"
          ? b.status === "requested"
          : status === "completed" && b.status === "accepted");
  if (!allowed) throw new Error("This booking cannot be changed.");
  publish({
    ...s,
    bookings: s.bookings.map((x) => (x.id === id ? { ...x, status } : x)),
  });
}
export function markPaid(id: string, reference: string) {
  const s = getSnapshot(),
    a = currentAccount(),
    b = s.bookings.find((b) => b.id === id);
  if (!b || b.customerId !== a?.id || b.status === "cancelled")
    throw new Error("This booking cannot be paid.");
  publish({
    ...s,
    bookings: s.bookings.map((x) =>
      x.id === id
        ? { ...x, payment: "mock-paid", paymentReference: reference }
        : x,
    ),
  });
}
export function addReview(bookingId: string, stars: number, text: string) {
  const s = getSnapshot(),
    a = currentAccount(),
    b = s.bookings.find((b) => b.id === bookingId);
  if (!a || !b || b.customerId !== a.id || b.status !== "completed")
    throw new Error("Only completed bookings can be reviewed.");
  if (s.reviews.some((r) => r.bookingId === bookingId))
    throw new Error("You already reviewed this booking.");
  if (
    !Number.isInteger(stars) ||
    stars < 1 ||
    stars > 5 ||
    text.trim().length < 5
  )
    throw new Error("Choose a rating and write a short review.");
  const review = {
    id: crypto.randomUUID(),
    bookingId,
    customerId: a.id,
    providerId: b.providerId,
    name: a.name,
    stars,
    text: text.trim(),
  };
  publish({
    ...s,
    reviews: [review, ...s.reviews],
    providers: s.providers.map((p) =>
      p.id === b.providerId
        ? {
            ...p,
            rating: (p.rating * p.reviewCount + stars) / (p.reviewCount + 1),
            reviewCount: p.reviewCount + 1,
          }
        : p,
    ),
  });
}
export function resetDemo() {
  publish(structuredClone(seed));
}
