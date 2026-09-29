const SENDER_ADDRESS = "noreply@hala-salah-elhosary.com";
const DEFAULT_FROM = `Hala Salah <${SENDER_ADDRESS}>`;

function formatFrom(fromName) {
  const clean = fromName
    ?.replace(/[\r\n<>"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return clean ? `${clean} <${SENDER_ADDRESS}>` : DEFAULT_FROM;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName,
  replyTo,
}) {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping send");
    return {};
  }

  const from = formatFrom(fromName);
  const body = { from, to, subject, html, text };
  if (replyTo) body.reply_to = replyTo;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "unknown error");
      console.error("[email error]", res.status, err);
      throw new Error(`Email send failed (${res.status})`);
    }

    const data = await res.json();
    return { id: data.id };
  } catch (err) {
    console.error("[email error]", err instanceof Error ? err.message : err);
    throw err instanceof Error ? err : new Error("Email send failed");
  }
}
