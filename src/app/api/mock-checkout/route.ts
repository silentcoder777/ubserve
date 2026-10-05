import { z } from "zod";
const request = z.object({
  bookingId: z.string().uuid(),
  amountCents: z.number().int().positive().max(8000000),
  scenario: z.enum(["success", "decline"]),
});
export async function POST(req: Request) {
  if (process.env.DISABLE_MOCK_PAYMENTS === "true")
    return Response.json({ error: "Mock checkout disabled." }, { status: 403 });
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const result = request.safeParse(raw);
  if (!result.success)
    return Response.json(
      { error: "Invalid checkout request." },
      { status: 400 },
    );
  if (result.data.scenario === "decline")
    return Response.json(
      { error: "Test payment declined. Try the successful payment scenario." },
      { status: 402 },
    );
  // Simulation only: no Stripe SDK, real card data, charge, or payment guarantee.
  return Response.json({
    id: `mock_pi_${crypto.randomUUID()}`,
    bookingId: result.data.bookingId,
    amount: result.data.amountCents,
    currency: "usd",
    status: "succeeded",
    mock: true,
  });
}
