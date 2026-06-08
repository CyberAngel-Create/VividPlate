// @ts-nocheck
import nodemailer from "nodemailer";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName?: string;
}

export async function sendBookingEmail(
  config: SmtpConfig,
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    const fromName = config.fromName || "Restaurant";
    const info = await transporter.sendMail({
      from: `"${fromName}" <${config.from}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId} to ${to}`);
    return { success: true };
  } catch (err: any) {
    console.error("Email send failed:", err.message);
    return { success: false, error: err.message };
  }
}

export function buildBookingCreatedEmail(
  restaurantName: string,
  guestName: string,
  bookingDate: string,
  bookingTime: string,
  partySize: number,
  websiteUrl: string
): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:8px;">
      <h2 style="color:#333;margin-top:0;">Booking Request Received</h2>
      <p>Hi ${guestName},</p>
      <p>Your table booking request has been submitted to <strong>${restaurantName}</strong>. Here are the details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Date</td><td style="padding:8px;border:1px solid #eee;">${bookingDate}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Time</td><td style="padding:8px;border:1px solid #eee;">${bookingTime}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Party Size</td><td style="padding:8px;border:1px solid #eee;">${partySize} guests</td></tr>
      </table>
      <p>The restaurant will contact you soon to confirm your reservation.</p>
      <p style="margin-top:24px;"><a href="${websiteUrl}" style="display:inline-block;padding:12px 24px;background:#FF6B35;color:#fff;text-decoration:none;border-radius:6px;">Visit Our Website</a></p>
    </div>
  `;
}

export function buildBookingStatusEmail(
  restaurantName: string,
  guestName: string,
  status: string,
  bookingDate: string,
  bookingTime: string,
  partySize: number,
  ownerNotes: string | null,
  websiteUrl: string
): string {
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "#f59e0b" },
    approved: { label: "Confirmed", color: "#22c55e" },
    declined: { label: "Declined", color: "#ef4444" },
  };
  const cfg = statusLabels[status] || statusLabels.pending;

  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:8px;">
      <h2 style="color:${cfg.color};margin-top:0;">Booking ${cfg.label}</h2>
      <p>Hi ${guestName},</p>
      <p>Your table booking at <strong>${restaurantName}</strong> has been <strong>${cfg.label.toLowerCase()}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Date</td><td style="padding:8px;border:1px solid #eee;">${bookingDate}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Time</td><td style="padding:8px;border:1px solid #eee;">${bookingTime}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Party Size</td><td style="padding:8px;border:1px solid #eee;">${partySize} guests</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">Status</td><td style="padding:8px;border:1px solid #eee;color:${cfg.color};font-weight:bold;">${cfg.label}</td></tr>
      </table>
      ${ownerNotes ? `<p style="background:#f9fafb;padding:12px;border-radius:6px;"><strong>Note from restaurant:</strong> ${ownerNotes}</p>` : ""}
      <p style="margin-top:24px;"><a href="${websiteUrl}" style="display:inline-block;padding:12px 24px;background:#FF6B35;color:#fff;text-decoration:none;border-radius:6px;">Visit Our Website</a></p>
    </div>
  `;
}
