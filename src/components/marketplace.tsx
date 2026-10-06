"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import Modal from "./modal";
import {
  Search,
  MapPin,
  Star,
  ArrowUpRight,
  Sparkles,
  ChefHat,
  Wrench,
  CalendarDays,
  Clock3,
  X,
  Check,
  SlidersHorizontal,
  ShieldCheck,
  Menu,
  CreditCard,
  CircleUserRound,
  UsersRound,
} from "lucide-react";
import {
  categories,
  money,
  quote,
  availableStartTimes,
  filterProviders,
  summarizeBookings,
  ranked,
  type Provider,
  type Booking,
  type Category,
} from "@/lib/model";
import {
  useDemo,
  enterDemo,
  signOut,
  saveProvider,
  requestBooking,
  rescheduleBooking,
  updateBooking,
  addReview,
  markPaid,
  resetDemo,
  switchDemoAccount,
} from "@/lib/store";
const icons = { Cleaning: Sparkles, Cooking: ChefHat, "Auto repair": Wrench };
type View = "discover" | "bookings" | "profile";
const bookingStatuses: Booking["status"][] = [
  "requested",
  "accepted",
  "completed",
  "cancelled",
];
type BookingFilter = "all" | Booking["status"];
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export default function Marketplace() {
  const state = useDemo(),
    account = state.accounts.find((a) => a.id === state.currentAccountId);
  const [view, setView] = useState<View>("discover"),
    [category, setCategory] = useState<(typeof categories)[number]>(
      "All services",
    ),
    [query, setQuery] = useState(""),
    [city, setCity] = useState(""),
    [pricingFilter, setPricingFilter] = useState<
      "all" | Provider["pricing"]
    >("all"),
    [maxPriceCents, setMaxPriceCents] = useState<number | null>(null),
    [sort, setSort] = useState("recommended");
  const [auth, setAuth] = useState(false),
    [authRole, setAuthRole] = useState<"customer" | "provider">("customer"),
    [selected, setSelected] = useState<Provider | null>(null),
    [reschedule, setReschedule] = useState<Booking | null>(null),
    [pendingCancellation, setPendingCancellation] = useState<Booking | null>(
      null,
    ),
    [review, setReview] = useState<Booking | null>(null),
    [checkout, setCheckout] = useState<Booking | null>(null),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [mobileMenu, setMobileMenu] = useState(false),
    [demoSwitcher, setDemoSwitcher] = useState(false),
    [bookingFilter, setBookingFilter] = useState<BookingFilter>("all");
  const [hours, setHours] = useState(2);
  const [bookingDate, setBookingDate] = useState(tomorrow());
  const [bookingTime, setBookingTime] = useState("10:00");
  function attempt(action: () => void) {
    setError("");
    try {
      action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }
  const providers = ranked(
    filterProviders(state.providers, {
      category,
      query,
      city,
      pricing: pricingFilter,
      maxPriceCents,
    }),
    sort,
  );
  const hasDiscoveryFilters =
    category !== "All services" ||
    Boolean(query.trim()) ||
    Boolean(city.trim()) ||
    pricingFilter !== "all" ||
    maxPriceCents !== null;
  function clearDiscoveryFilters() {
    setQuery("");
    setCity("");
    setCategory("All services");
    setPricingFilter("all");
    setMaxPriceCents(null);
  }
  const profile = state.providers.find((p) => p.accountId === account?.id);
  const availableTimes = selected
    ? availableStartTimes(selected, bookingDate, hours, state.bookings)
    : [];
  const rescheduleProvider = state.providers.find(
    (provider) => provider.id === reschedule?.providerId,
  );
  const rescheduleTimes =
    reschedule && rescheduleProvider
      ? availableStartTimes(
          rescheduleProvider,
          bookingDate,
          hours,
          state.bookings.filter((booking) => booking.id !== reschedule.id),
        )
      : [];
  const bookings = state.bookings.filter((b) =>
    account?.role === "provider"
      ? b.providerId === profile?.id
      : b.customerId === account?.id,
  );
  const pending = bookings.filter((b) => b.status === "requested").length;
  const bookingSummary = summarizeBookings(bookings);
  const bookingSummaryItems =
    account?.role === "provider"
      ? [
          {
            label: "New requests",
            value: String(bookingSummary.requested),
            detail: "Awaiting your decision",
          },
          {
            label: "Accepted visits",
            value: String(bookingSummary.accepted),
            detail: "Confirmed work",
          },
          {
            label: "Completed jobs",
            value: String(bookingSummary.completed),
            detail: "Finished services",
          },
          {
            label: "Pipeline value",
            value: money(bookingSummary.bookedValueCents),
            detail: "Non-cancelled demo totals",
          },
        ]
      : [
          {
            label: "Active bookings",
            value: String(bookingSummary.active),
            detail: "Requested or accepted",
          },
          {
            label: "Completed services",
            value: String(bookingSummary.completed),
            detail: "Ready for review",
          },
          {
            label: "Mock paid",
            value: String(bookingSummary.mockPaid),
            detail: "Simulation only",
          },
          {
            label: "Booked value",
            value: money(bookingSummary.bookedValueCents),
            detail: "Non-cancelled demo totals",
          },
        ];
  const visibleBookings =
    bookingFilter === "all"
      ? bookings
      : bookings.filter((booking) => booking.status === bookingFilter);
  function navigate(next: View) {
    setView(next);
    setMobileMenu(false);
    setError("");
    setNotice("");
  }
  function authSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    attempt(() => {
      enterDemo(String(f.get("name")), String(f.get("email")), authRole);
      setBookingFilter("all");
      setAuth(false);
      setNotice("Your demo account is ready.");
      if (authRole === "provider") setView("profile");
    });
  }
  function bookSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget);
    attempt(() => {
      const b = requestBooking(
        selected.id,
        `${bookingDate}T${bookingTime}`,
        hours,
        String(f.get("address")),
        String(f.get("notes")),
      );
      setSelected(null);
      setView("bookings");
      setNotice(
        "Booking requested. Try the mock checkout or wait for the provider to accept.",
      );
      setCheckout(b);
    });
  }
  function profileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    attempt(() => {
      saveProvider({
        name: String(f.get("name")),
        title: String(f.get("title")),
        bio: String(f.get("bio")),
        city: String(f.get("city")),
        category: String(f.get("category")) as Category,
        priceCents: Math.round(Number(f.get("price")) * 100),
        pricing: String(f.get("pricing")) as "hourly" | "fixed",
        experience: String(f.get("experience")),
        days: f.getAll("days").map(Number),
        startHour: Number(f.get("startHour")),
        endHour: Number(f.get("endHour")),
      });
      setNotice("Profile published. Customers can now discover your service.");
    });
  }
  function rescheduleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reschedule) return;
    const resetPayment = reschedule.payment === "mock-paid";
    attempt(() => {
      rescheduleBooking(
        reschedule.id,
        `${bookingDate}T${bookingTime}`,
        hours,
      );
      setReschedule(null);
      setNotice(
        resetPayment
          ? "Booking rescheduled. The prior mock payment was reset; no money was charged."
          : "Booking rescheduled. The provider can see the new time.",
      );
    });
  }
  async function pay(scenario: "success" | "decline") {
    if (!checkout) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/mock-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: checkout.id,
          amountCents: checkout.totalCents,
          scenario,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      markPaid(checkout.id, data.id);
      setCheckout(null);
      setNotice("Test payment succeeded. No money was charged.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }
  function changeBookingStatus(
    booking: Booking,
    status: Booking["status"],
  ) {
    attempt(() => {
      updateBooking(booking.id, status);
      setPendingCancellation(null);
      setNotice(
        status === "accepted"
          ? "Booking accepted. The customer can see the confirmed status."
          : status === "completed"
            ? "Service marked complete. The customer can now leave a review."
            : account?.role === "provider" && booking.status === "requested"
              ? "Request declined. The customer can see the cancelled status."
              : "Booking cancelled. No real payment or refund was processed.",
      );
    });
  }
  return (
    <>
      <div className="demo-bar">
        <span>
          <span className="live-dot" /> Investor preview
        </span>
        <span className="demo-note">
          Sample providers · Browser-local demo accounts · No real charges
        </span>
        <button
          className="demo-switch-button"
          onClick={() => {
            setDemoSwitcher(true);
            setError("");
          }}
        >
          <UsersRound size={14} /> Switch demo view
        </button>
      </div>
      <header>
        <div className="nav-shell">
          <button
            aria-label="Ubserve home"
            className="brand"
            onClick={() => navigate("discover")}
          >
            <span className="brand-mark">
              u<span />
            </span>
            ubserve<span className="brand-period">.</span>
          </button>
          <nav className={mobileMenu ? "open" : ""}>
            <button
              className={view === "discover" ? "active" : ""}
              onClick={() => navigate("discover")}
            >
              Find a service
            </button>
            <button
              className={view === "bookings" ? "active" : ""}
              onClick={() => navigate("bookings")}
            >
              My bookings{" "}
              {pending > 0 && <span className="count">{pending}</span>}
            </button>
            {account?.role === "provider" && (
              <button
                className={view === "profile" ? "active" : ""}
                onClick={() => navigate("profile")}
              >
                My provider profile
              </button>
            )}
          </nav>
          <div className="nav-actions">
            {account ? (
              <>
                <span className="account-name">
                  <CircleUserRound size={18} />
                  {account.name.split(" ")[0]}
                </span>
                <button
                  className="text-button"
                  onClick={() =>
                    attempt(() => {
                      signOut();
                      setView("discover");
                      setNotice("Signed out of the demo account.");
                    })
                  }
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  className="text-button"
                  onClick={() => {
                    setAuthRole("customer");
                    setAuth(true);
                    setError("");
                  }}
                >
                  Join / sign in
                </button>
                <button
                  className="primary small"
                  onClick={() => {
                    setAuthRole("provider");
                    setAuth(true);
                    setError("");
                  }}
                >
                  Offer a service
                </button>
              </>
            )}
            <button
              className="mobile-toggle icon-button"
              aria-label="Toggle navigation"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>
      <main>
        {notice && (
          <div role="status" className="notice">
            <Check size={18} />
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {error &&
          !auth &&
          !selected &&
          !reschedule &&
          !review &&
          !checkout && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        {view === "discover" && (
          <>
            <section className="intro">
              <div>
                <div className="eyebrow">
                  <MapPin size={15} /> LOCAL SERVICES, PERSONAL CHOICE
                </div>
                <h1>
                  A little help.
                  <br />
                  <span>A lot more life.</span>
                </h1>
                <p>
                  Find the right person for your home, your kitchen,
                  <br className="desktop-break" /> and your everyday to-do list.
                  You choose who. We make it easy.
                </p>
              </div>
              <div className="intro-aside">
                <div className="mini-card">
                  <span className="mini-icon">
                    <CalendarDays size={22} />
                  </span>
                  <div>
                    <b>Your day, your way</b>
                    <p>Local help that fits your schedule.</p>
                  </div>
                </div>
                <div className="mini-card">
                  <span className="mini-icon orange">
                    <ShieldCheck size={22} />
                  </span>
                  <div>
                    <b>Know before you book</b>
                    <p>Clear prices. People you can compare.</p>
                  </div>
                </div>
                <div className="city-chip">
                  <MapPin size={15} /> Starting in Ames, Iowa
                </div>
              </div>
            </section>
            <section className="search-panel" aria-label="Find providers">
              <label className="search-input">
                <Search size={21} />
                <input
                  aria-label="Search services or providers"
                  placeholder="What can we help you with?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label className="location-input">
                <MapPin size={20} />
                <input
                  aria-label="City"
                  placeholder="Ames, IA"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
              <button
                className="primary"
                onClick={() =>
                  document
                    .getElementById("results")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Find local help <Search size={17} />
              </button>
            </section>
            <div className="category-row">
              {categories.map((c) => {
                const Icon =
                  c === "All services" ? SlidersHorizontal : icons[c];
                return (
                  <button
                    key={c}
                    className={
                      category === c ? "category selected" : "category"
                    }
                    onClick={() => setCategory(c)}
                  >
                    <Icon size={18} />
                    {c}
                  </button>
                );
              })}
            </div>
            <div
              className="discovery-filters"
              role="group"
              aria-label="Price filters"
            >
              <span>Refine by price</span>
              <label>
                Pricing model
                <select
                  aria-label="Pricing model"
                  value={pricingFilter}
                  onChange={(event) =>
                    setPricingFilter(
                      event.target.value as "all" | Provider["pricing"],
                    )
                  }
                >
                  <option value="all">Hourly or fixed</option>
                  <option value="hourly">Hourly only</option>
                  <option value="fixed">Fixed price only</option>
                </select>
              </label>
              <label>
                Maximum listed price
                <select
                  aria-label="Maximum listed price"
                  value={maxPriceCents ?? "any"}
                  onChange={(event) =>
                    setMaxPriceCents(
                      event.target.value === "any"
                        ? null
                        : Number(event.target.value),
                    )
                  }
                >
                  <option value="any">Any price</option>
                  <option value="4000">Up to $40</option>
                  <option value="6000">Up to $60</option>
                  <option value="7500">Up to $75</option>
                  <option value="10000">Up to $100</option>
                </select>
              </label>
              {hasDiscoveryFilters && (
                <button className="text-button" onClick={clearDiscoveryFilters}>
                  Reset filters
                </button>
              )}
            </div>
            <section id="results">
              <div className="section-head">
                <div>
                  <h2>Your next helping hand</h2>
                  <p>
                    {providers.length}{" "}
                    {providers.length === 1 ? "provider" : "providers"} to
                    explore{city ? ` in ${city}` : " in Ames"} · Sample profiles
                  </p>
                </div>
                <label className="sort-label">
                  Sort by{" "}
                  <select
                    aria-label="Sort providers"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price">Lowest listed price</option>
                  </select>
                </label>
              </div>
              <div className="provider-grid">
                {providers.map((p) => {
                  const Icon = icons[p.category];
                  return (
                    <article className="provider-card" key={p.id}>
                      <div className={`card-art ${p.color}`}>
                        <span className="service-pill">
                          <Icon size={14} />
                          {p.category}
                        </span>
                        <div className="monogram">
                          {p.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="sample-badge">Sample profile</span>
                      </div>
                      <div className="card-body">
                        <div className="name-row">
                          <h3>{p.name}</h3>
                          <span className="rating">
                            <Star size={14} fill="currentColor" />
                            {p.reviewCount ? p.rating.toFixed(1) : "New"}
                            {p.reviewCount > 0 && (
                              <small>({p.reviewCount})</small>
                            )}
                          </span>
                        </div>
                        <p className="provider-title">{p.title}</p>
                        <div className="provider-meta">
                          <MapPin size={14} />
                          {p.city}
                          <span>·</span>
                          {p.experience}
                        </div>
                        <div className="card-bottom">
                          <div>
                            <strong>{money(p.priceCents)}</strong>
                            <span>
                              {" "}
                              / {p.pricing === "hourly" ? "hour" : "visit"}
                            </span>
                          </div>
                          <button
                            className="profile-link"
                            onClick={() => {
                              const duration = p.pricing === "fixed" ? 1 : 2;
                              const date = tomorrow();
                              const times = availableStartTimes(
                                p,
                                date,
                                duration,
                                state.bookings,
                              );
                              setSelected(p);
                              setHours(duration);
                              setBookingDate(date);
                              setBookingTime(times[0] ?? "");
                              setError("");
                            }}
                          >
                            View & book <ArrowUpRight size={17} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!providers.length && (
                <div className="empty">
                  <Search size={32} />
                  <h3>No providers found</h3>
                  <p>Try another name, category, or city.</p>
                  <button
                    className="secondary"
                    onClick={clearDiscoveryFilters}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </section>
            <div className="provider-cta">
              <div>
                <span className="eyebrow">MAKE YOUR SKILLS GO FURTHER</span>
                <h2>Your expertise. Your prices. Your schedule.</h2>
                <p>Create a provider profile and connect with people nearby.</p>
              </div>
              <button
                className="primary"
                onClick={() => {
                  if (account?.role === "provider") navigate("profile");
                  else {
                    setAuthRole("provider");
                    setAuth(true);
                    setError("");
                  }
                }}
              >
                Become a provider <ArrowUpRight size={18} />
              </button>
            </div>
          </>
        )}
        {view === "profile" && (
          <section className="dashboard">
            <div className="section-head">
              <div>
                <div className="eyebrow">PROVIDER WORKSPACE</div>
                <h1>Your business, your way.</h1>
                <p>
                  Publish a service with clear pricing and the hours that work
                  for you.
                </p>
              </div>
            </div>
            {account?.role !== "provider" ? (
              <div className="empty">
                <h3>Create a provider account to get started</h3>
                <button
                  className="primary"
                  onClick={() => {
                    setAuthRole("provider");
                    setAuth(true);
                  }}
                >
                  Create provider account
                </button>
              </div>
            ) : (
              <form className="profile-form" onSubmit={profileSubmit}>
                <div className="form-grid">
                  <Field label="Display name">
                    <input
                      name="name"
                      required
                      defaultValue={profile?.name ?? account.name}
                      maxLength={80}
                    />
                  </Field>
                  <Field label="City and state">
                    <input
                      name="city"
                      required
                      defaultValue={profile?.city ?? "Ames, IA"}
                    />
                  </Field>
                  <Field label="Service category">
                    <select
                      name="category"
                      defaultValue={profile?.category ?? "Cleaning"}
                    >
                      {categories.slice(1).map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Experience">
                    <input
                      name="experience"
                      defaultValue={profile?.experience ?? ""}
                      placeholder="e.g. 3 years of experience"
                    />
                  </Field>
                </div>
                <Field label="Profile headline">
                  <input
                    name="title"
                    required
                    defaultValue={profile?.title ?? ""}
                    maxLength={100}
                    placeholder="Tell customers what makes your service great"
                  />
                </Field>
                <Field label="About your service and what’s included">
                  <textarea
                    name="bio"
                    required
                    defaultValue={profile?.bio ?? ""}
                    rows={4}
                    maxLength={1500}
                  />
                </Field>
                <div className="form-grid">
                  <Field label="Price (USD)">
                    <input
                      name="price"
                      type="number"
                      min="1"
                      max="10000"
                      step="0.01"
                      required
                      defaultValue={profile ? profile.priceCents / 100 : 35}
                    />
                  </Field>
                  <Field label="Pricing type">
                    <select
                      name="pricing"
                      defaultValue={profile?.pricing ?? "hourly"}
                    >
                      <option value="hourly">Per hour</option>
                      <option value="fixed">Fixed price per visit</option>
                    </select>
                  </Field>
                </div>
                <fieldset>
                  <legend>Available days</legend>
                  <div className="day-picker">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day, i) => (
                        <label key={day}>
                          <input
                            name="days"
                            type="checkbox"
                            value={i}
                            defaultChecked={
                              profile
                                ? profile.days.includes(i)
                                : i > 0 && i < 6
                            }
                          />
                          <span>{day}</span>
                        </label>
                      ),
                    )}
                  </div>
                </fieldset>
                <div className="form-grid">
                  <Field label="Start hour (local time)">
                    <input
                      name="startHour"
                      type="number"
                      min="0"
                      max="23"
                      defaultValue={profile?.startHour ?? 8}
                    />
                  </Field>
                  <Field label="End hour (local time)">
                    <input
                      name="endHour"
                      type="number"
                      min="1"
                      max="24"
                      defaultValue={profile?.endHour ?? 18}
                    />
                  </Field>
                </div>
                <button className="primary" type="submit">
                  {profile ? "Save profile" : "Publish profile"}{" "}
                  <Check size={18} />
                </button>
              </form>
            )}
          </section>
        )}
        {view === "bookings" && (
          <section className="dashboard">
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  {account?.role === "provider"
                    ? "PROVIDER WORKSPACE"
                    : "YOUR SERVICES"}
                </div>
                <h1>
                  {account?.role === "provider"
                    ? "Your upcoming work."
                    : "A little less on your plate."}
                </h1>
                <p>
                  {account?.role === "provider"
                    ? "Review requests and manage your appointments."
                    : "Track your bookings, payments, and completed services."}
                </p>
              </div>
            </div>
            {!account ? (
              <div className="empty">
                <CalendarDays size={32} />
                <h3>Your bookings live here</h3>
                <p>Open a demo account to book a service.</p>
                <button
                  className="primary"
                  onClick={() => {
                    setAuthRole("customer");
                    setAuth(true);
                  }}
                >
                  Join / sign in
                </button>
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty">
                <CalendarDays size={32} />
                <h3>No bookings yet</h3>
                <p>
                  {account.role === "provider"
                    ? "Publish your profile and wait for your first request."
                    : "Find a provider and make your first booking."}
                </p>
                <button
                  className="primary"
                  onClick={() =>
                    navigate(
                      account.role === "provider" ? "profile" : "discover",
                    )
                  }
                >
                  {account.role === "provider"
                    ? "Edit profile"
                    : "Explore services"}
                </button>
              </div>
            ) : (
              <>
                <section
                  className="booking-summary"
                  aria-label="Booking summary"
                >
                  {bookingSummaryItems.map((item) => (
                    <article
                      key={item.label}
                      aria-label={`${item.label}: ${item.value}`}
                    >
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <small>{item.detail}</small>
                    </article>
                  ))}
                </section>
                <div
                  className="booking-filters"
                  role="group"
                  aria-label="Filter bookings"
                >
                  <button
                    className={bookingFilter === "all" ? "active" : ""}
                    aria-pressed={bookingFilter === "all"}
                    onClick={() => setBookingFilter("all")}
                  >
                    All <span>{bookings.length}</span>
                  </button>
                  {bookingStatuses.map((status) => {
                    const count = bookings.filter(
                      (booking) => booking.status === status,
                    ).length;
                    return (
                      <button
                        className={bookingFilter === status ? "active" : ""}
                        aria-pressed={bookingFilter === status}
                        key={status}
                        onClick={() => setBookingFilter(status)}
                      >
                        {status} <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
                {visibleBookings.length === 0 ? (
                  <div className="empty booking-filter-empty">
                    <CalendarDays size={28} />
                    <h3>No {bookingFilter} bookings</h3>
                    <p>Choose another status to see your appointments.</p>
                    <button
                      className="secondary"
                      onClick={() => setBookingFilter("all")}
                    >
                      Show all bookings
                    </button>
                  </div>
                ) : (
                  <div className="booking-list">
                    {visibleBookings.map((b) => (
                  <article className="booking-card" key={b.id}>
                    <div className="booking-top">
                      <div>
                        <span className="eyebrow">{b.service}</span>
                        <h3>
                          {account.role === "provider"
                            ? state.accounts.find((a) => a.id === b.customerId)
                                ?.name
                            : b.providerName}
                        </h3>
                      </div>
                      <span className={`status ${b.status}`}>{b.status}</span>
                    </div>
                    <div className="booking-details">
                      <span>
                        <CalendarDays size={16} />
                        {new Date(b.startsAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      <span>
                        <Clock3 size={16} />
                        {b.hours} {b.hours === 1 ? "hour" : "hours"}
                      </span>
                      <span>
                        <MapPin size={16} />
                        {b.address}
                      </span>
                    </div>
                    {b.notes && <p className="booking-notes">{b.notes}</p>}
                    <div className="booking-bottom">
                      <div>
                        <strong>{money(b.totalCents)}</strong>
                        <span className="payment-label">
                          {b.payment === "mock-paid"
                            ? "Test payment complete"
                            : "Not paid"}
                        </span>
                      </div>
                      <div className="booking-actions">
                        {account.role === "provider" &&
                          b.status === "requested" && (
                            <button
                              className="primary small"
                              onClick={() => changeBookingStatus(b, "accepted")}
                            >
                              Accept request
                            </button>
                          )}
                        {account.role === "provider" &&
                          b.status === "accepted" && (
                            <button
                              className="primary small"
                              onClick={() =>
                                changeBookingStatus(b, "completed")
                              }
                            >
                              Mark complete
                            </button>
                          )}
                        {account.role === "customer" &&
                          b.status === "requested" && (
                            <button
                              className="secondary small"
                              onClick={() => {
                                const provider = state.providers.find(
                                  (candidate) => candidate.id === b.providerId,
                                );
                                const start = new Date(b.startsAt);
                                const date = `${start.getFullYear()}-${String(
                                  start.getMonth() + 1,
                                ).padStart(2, "0")}-${String(
                                  start.getDate(),
                                ).padStart(2, "0")}`;
                                const time = `${String(
                                  start.getHours(),
                                ).padStart(2, "0")}:${String(
                                  start.getMinutes(),
                                ).padStart(2, "0")}`;
                                const times = provider
                                  ? availableStartTimes(
                                      provider,
                                      date,
                                      b.hours,
                                      state.bookings.filter(
                                        (booking) => booking.id !== b.id,
                                      ),
                                    )
                                  : [];
                                setReschedule(b);
                                setHours(b.hours);
                                setBookingDate(date);
                                setBookingTime(
                                  times.includes(time) ? time : (times[0] ?? ""),
                                );
                                setError("");
                              }}
                            >
                              Reschedule
                            </button>
                          )}
                        {account.role === "customer" &&
                          b.payment === "unpaid" &&
                          b.status !== "cancelled" && (
                            <button
                              className="secondary small"
                              onClick={() => {
                                setCheckout(b);
                                setError("");
                              }}
                            >
                              Test checkout
                            </button>
                          )}
                        {account.role === "customer" &&
                          b.status === "completed" &&
                          !state.reviews.some((r) => r.bookingId === b.id) && (
                            <button
                              className="secondary small"
                              onClick={() => {
                                setReview(b);
                                setError("");
                              }}
                            >
                              Leave a review
                            </button>
                          )}
                        {["requested", "accepted"].includes(b.status) && (
                          <button
                            className="text-button"
                            onClick={() => {
                              setPendingCancellation(b);
                              setError("");
                            }}
                          >
                            {account.role === "provider" &&
                            b.status === "requested"
                              ? "Decline"
                              : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>
      <footer>
        <span className="footer-brand">ubserve.</span>
        <span>Local help. On your terms.</span>
        <button
          onClick={() => {
            if (
              window.confirm(
                "Clear all browser-local demo accounts, bookings, and reviews?",
              )
            )
              attempt(() => {
                resetDemo();
                setView("discover");
                setNotice("Demo reset.");
              });
          }}
        >
          Reset demo data
        </button>
      </footer>
      {auth && (
        <Modal
          title="Make yourself at home"
          onClose={() => {
            setAuth(false);
            setError("");
          }}
        >
          <p className="muted">
            Create or reopen a browser-local demo account. No password or email
            verification is used in this preview. Use a fictional email.
          </p>
          <div className="role-toggle">
            <button
              className={authRole === "customer" ? "selected" : ""}
              onClick={() => setAuthRole("customer")}
            >
              I need a service
            </button>
            <button
              className={authRole === "provider" ? "selected" : ""}
              onClick={() => setAuthRole("provider")}
            >
              I offer a service
            </button>
          </div>
          <form onSubmit={authSubmit}>
            <Field label="Your name">
              <input
                name="name"
                required
                placeholder="Alex Morgan"
                autoComplete="name"
              />
            </Field>
            <Field label="Demo email">
              <input
                name="email"
                required
                type="email"
                placeholder="alex@example.test"
              />
            </Field>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary full" type="submit">
              Continue as {authRole}
            </button>
          </form>
          <div className="demo-help">
            To manage Maya’s sample profile, use <b>Maya Thompson</b>,{" "}
            <b>p1@example.test</b>, and the provider role.
          </div>
        </Modal>
      )}
      {demoSwitcher && (
        <Modal
          title="Switch demo view"
          onClose={() => {
            setDemoSwitcher(false);
            setError("");
          }}
        >
          <p className="muted">
            Follow the same booking as each participant without signing in
            again. This presentation shortcut changes only browser-local demo
            state and is not production authentication.
          </p>
          <div className="demo-account-list">
            {state.accounts.map((candidate) => (
              <button
                className={
                  candidate.id === account?.id
                    ? "demo-account active"
                    : "demo-account"
                }
                key={candidate.id}
                aria-label={`${candidate.name} ${candidate.role}`}
                onClick={() =>
                  attempt(() => {
                    const next = switchDemoAccount(candidate.id);
                    setBookingFilter("all");
                    setDemoSwitcher(false);
                    setView("bookings");
                    setNotice(
                      `Previewing ${next.name}’s ${next.role} workspace.`,
                    );
                  })
                }
              >
                <span>
                  <b>{candidate.name}</b>
                  <small>{candidate.role}</small>
                </span>
                {candidate.id === account?.id && <Check size={17} />}
              </button>
            ))}
          </div>
          <p className="fine-print">
            Customer accounts appear here after you create them through the
            regular Join / sign in flow.
          </p>
        </Modal>
      )}
      {selected && (
        <Modal
          title={selected.name}
          onClose={() => {
            setSelected(null);
            setError("");
          }}
        >
          <div className="detail-meta">
            <span className="tag">{selected.category}</span>
            <span>
              <Star size={15} />
              {selected.reviewCount
                ? `${selected.rating.toFixed(1)} · ${selected.reviewCount} reviews`
                : "New provider"}
            </span>
            <span>
              <MapPin size={15} />
              {selected.city}
            </span>
          </div>
          <h3 className="detail-title">{selected.title}</h3>
          <p className="detail-bio">{selected.bio}</p>
          <div className="availability">
            <Clock3 size={17} />
            {selected.days
              .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
              .join(", ")}{" "}
            · {selected.startHour}:00–{selected.endHour}:00 local time
          </div>
          {state.reviews
            .filter((r) => r.providerId === selected.id)
            .map((r) => (
              <blockquote key={r.id}>
                <b>
                  {r.name} · {r.stars}/5
                </b>
                <p>{r.text}</p>
              </blockquote>
            ))}
          {selected.reviewCount > 0 && (
            <p className="fine-print">
              Initial ratings and review counts are sample data. New demo
              reviews come from completed bookings.
            </p>
          )}
          <form onSubmit={bookSubmit}>
            <div className="form-grid">
              <Field label="Date">
                <input
                  name="date"
                  required
                  type="date"
                  min={tomorrow()}
                  value={bookingDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    const times = availableStartTimes(
                      selected,
                      date,
                      hours,
                      state.bookings,
                    );
                    setBookingDate(date);
                    setBookingTime(times[0] ?? "");
                  }}
                />
              </Field>
              <Field label="Start time">
                <select
                  name="time"
                  required
                  value={bookingTime}
                  disabled={!availableTimes.length}
                  onChange={(e) => setBookingTime(e.target.value)}
                >
                  {!availableTimes.length && (
                    <option value="">No times available</option>
                  )}
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {new Date(`${bookingDate}T${time}`).toLocaleTimeString(
                        undefined,
                        { hour: "numeric", minute: "2-digit" },
                      )}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              label={
                selected.pricing === "hourly"
                  ? "Duration"
                  : "Reserved visit duration"
              }
            >
              <select
                value={hours}
                onChange={(e) => {
                  const duration = Number(e.target.value);
                  const times = availableStartTimes(
                    selected,
                    bookingDate,
                    duration,
                    state.bookings,
                  );
                  setHours(duration);
                  setBookingTime(
                    times.includes(bookingTime)
                      ? bookingTime
                      : (times[0] ?? ""),
                  );
                }}
              >
                {[1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8].map((h) => (
                  <option key={h} value={h}>
                    {h} {h === 1 ? "hour" : "hours"}
                  </option>
                ))}
              </select>
            </Field>
            {!availableTimes.length && (
              <p className="error" role="alert">
                No available times for this date and duration. Try another date
                or a shorter visit.
              </p>
            )}
            <Field label="Service address">
              <input
                name="address"
                required
                placeholder="123 Main St, Ames, IA"
                maxLength={200}
              />
            </Field>
            <Field label="Anything the provider should know? (optional)">
              <textarea
                name="notes"
                rows={2}
                maxLength={1000}
                placeholder="Your priorities, parking instructions, or questions"
              />
            </Field>
            <div className="estimate">
              <span>
                {selected.pricing === "hourly"
                  ? `${money(selected.priceCents)} × ${hours} hours`
                  : "Fixed visit price"}
                <small>
                  No platform fee in this demo. No payment is charged when you
                  request.
                </small>
              </span>
              <strong>{money(quote(selected, hours))}</strong>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {account?.role === "customer" ? (
              <button
                className="primary full"
                type="submit"
                disabled={!availableTimes.length}
              >
                Request booking <CalendarDays size={18} />
              </button>
            ) : (
              <button
                className="primary full"
                type="button"
                onClick={() => {
                  setSelected(null);
                  setAuthRole("customer");
                  setAuth(true);
                  setError("");
                }}
              >
                Open a customer account to book
              </button>
            )}
          </form>
        </Modal>
      )}
      {reschedule && rescheduleProvider && (
        <Modal
          title={`Reschedule ${reschedule.providerName}`}
          onClose={() => {
            setReschedule(null);
            setError("");
          }}
        >
          <p className="muted">
            Choose a new available time while this request is awaiting the
            provider. The total is recalculated from the provider’s current
            listed price.
          </p>
          <form onSubmit={rescheduleSubmit}>
            <div className="form-grid">
              <Field label="New date">
                <input
                  required
                  type="date"
                  min={tomorrow()}
                  value={bookingDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    const times = availableStartTimes(
                      rescheduleProvider,
                      date,
                      hours,
                      state.bookings.filter(
                        (booking) => booking.id !== reschedule.id,
                      ),
                    );
                    setBookingDate(date);
                    setBookingTime(times[0] ?? "");
                  }}
                />
              </Field>
              <Field label="New start time">
                <select
                  required
                  value={bookingTime}
                  disabled={!rescheduleTimes.length}
                  onChange={(e) => setBookingTime(e.target.value)}
                >
                  {!rescheduleTimes.length && (
                    <option value="">No times available</option>
                  )}
                  {rescheduleTimes.map((time) => (
                    <option key={time} value={time}>
                      {new Date(`${bookingDate}T${time}`).toLocaleTimeString(
                        undefined,
                        { hour: "numeric", minute: "2-digit" },
                      )}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="New duration">
              <select
                value={hours}
                onChange={(e) => {
                  const duration = Number(e.target.value);
                  const times = availableStartTimes(
                    rescheduleProvider,
                    bookingDate,
                    duration,
                    state.bookings.filter(
                      (booking) => booking.id !== reschedule.id,
                    ),
                  );
                  setHours(duration);
                  setBookingTime(
                    times.includes(bookingTime)
                      ? bookingTime
                      : (times[0] ?? ""),
                  );
                }}
              >
                {[1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8].map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} {duration === 1 ? "hour" : "hours"}
                  </option>
                ))}
              </select>
            </Field>
            {!rescheduleTimes.length && (
              <p className="error" role="alert">
                No available times for this date and duration. Try another date
                or a shorter visit.
              </p>
            )}
            {reschedule.payment === "mock-paid" && (
              <p className="fine-print">
                Saving a new quote resets the simulated payment to unpaid. No
                real charge or refund occurs in this demo.
              </p>
            )}
            <div className="estimate">
              <span>
                Updated demo total
                <small>
                  {rescheduleProvider.pricing === "hourly"
                    ? `${money(rescheduleProvider.priceCents)} × ${hours} hours`
                    : "Fixed visit price"}
                </small>
              </span>
              <strong>{money(quote(rescheduleProvider, hours))}</strong>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              className="primary full"
              type="submit"
              disabled={!rescheduleTimes.length}
            >
              Save new time <CalendarDays size={18} />
            </button>
          </form>
        </Modal>
      )}
      {pendingCancellation && (
        <Modal
          title={
            account?.role === "provider" &&
            pendingCancellation.status === "requested"
              ? "Decline this request?"
              : "Cancel this booking?"
          }
          onClose={() => {
            setPendingCancellation(null);
            setError("");
          }}
        >
          <p className="muted">
            {account?.role === "provider" &&
            pendingCancellation.status === "requested"
              ? "The customer will see this request as cancelled and the time will become available again."
              : "The appointment will be cancelled and the time will become available again."}
          </p>
          <div className="confirmation-summary">
            <span>
              {pendingCancellation.service} with{" "}
              <b>
                {account?.role === "provider"
                  ? state.accounts.find(
                      (candidate) =>
                        candidate.id === pendingCancellation.customerId,
                    )?.name
                  : pendingCancellation.providerName}
              </b>
            </span>
            <span>
              {new Date(pendingCancellation.startsAt).toLocaleString(
                undefined,
                { dateStyle: "medium", timeStyle: "short" },
              )}
            </span>
            <strong>{money(pendingCancellation.totalCents)}</strong>
          </div>
          <p className="fine-print">
            This is browser-local demo data. No real payment or refund will be
            processed.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="confirmation-actions">
            <button
              className="secondary"
              onClick={() => setPendingCancellation(null)}
            >
              Keep booking
            </button>
            <button
              className="primary"
              onClick={() =>
                changeBookingStatus(pendingCancellation, "cancelled")
              }
            >
              {account?.role === "provider" &&
              pendingCancellation.status === "requested"
                ? "Decline request"
                : "Cancel booking"}
            </button>
          </div>
        </Modal>
      )}
      {checkout && (
        <Modal
          title="Test checkout"
          onClose={() => {
            setCheckout(null);
            setError("");
          }}
        >
          <div className="checkout-icon">
            <CreditCard size={30} />
          </div>
          <p className="muted">
            Simulated Stripe-style payment. No real card details, Stripe
            connection, or charges.
          </p>
          <div className="estimate">
            <span>
              {checkout.service}
              <small>{checkout.providerName}</small>
            </span>
            <strong>{money(checkout.totalCents)}</strong>
          </div>
          <div className="test-card">
            <span>TEST PAYMENT METHOD</span>
            <b>•••• •••• •••• 4242</b>
            <small>Fictional card · No card entry needed</small>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="primary full"
            onClick={() => pay("success")}
          >
            {busy
              ? "Processing…"
              : `Simulate payment · ${money(checkout.totalCents)}`}
          </button>
          <button
            disabled={busy}
            className="secondary full"
            onClick={() => pay("decline")}
          >
            Test declined payment
          </button>
          <p className="fine-print">
            Payment and booking status are independent. A booking request still
            needs provider acceptance.
          </p>
        </Modal>
      )}
      {review && (
        <Modal
          title="How did it go?"
          onClose={() => {
            setReview(null);
            setError("");
          }}
        >
          <p className="muted">
            Review your completed service with {review.providerName}.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              attempt(() => {
                addReview(
                  review.id,
                  Number(f.get("stars")),
                  String(f.get("text")),
                );
                setReview(null);
                setNotice("Review published. Thank you!");
              });
            }}
          >
            <Field label="Rating">
              <select name="stars" defaultValue="5">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "star" : "stars"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Your review">
              <textarea
                required
                name="text"
                minLength={5}
                maxLength={1000}
                rows={4}
              />
            </Field>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary full" type="submit">
              Publish review
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
