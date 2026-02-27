import * as admin from "firebase-admin";
admin.initializeApp();

import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { Resend } from "resend";

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

// ⚠️ Cambiá por un remitente verificado en Resend (dominio verificado)
const FROM = "HOSTLY <no-reply@tu-dominio.com>";

function baseEmailHtml(title: string, bodyHtml: string) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f4f6f8; padding:40px 20px;">
    <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:12px; padding:40px 30px; box-shadow:0 4px 20px rgba(0,0,0,0.05); text-align:center;">
      <div style="margin-bottom:30px;">
        <img src="https://hostly-eight.vercel.app/favicon.svg" alt="HOSTLY" style="width:110px; height:auto;" />
      </div>
      <h2 style="margin:0 0 20px; font-size:22px; color:#111827;">${title}</h2>
      <div style="font-size:15px; color:#4b5563; line-height:1.6; text-align:left;">
        ${bodyHtml}
      </div>
      <hr style="border:none; border-top:1px solid #e5e7eb; margin:30px 0;" />
      <p style="font-size:12px; color:#9ca3af; margin:0; text-align:center;">
        © 2026 HOSTLY – Todos los derechos reservados.
      </p>
    </div>
  </div>`;
}

function fmtDate(d: any) {
  if (!d) return "-";
  const date = d.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("es-AR");
}

export const onReservationCreatedSendEmails = onDocumentCreated(
  {
    document: "hostels/{hostelSlug}/reservations/{reservationId}",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const r = event.data?.data() as any;
    if (!r?.email) return;

    const hostelSlug = event.params.hostelSlug as string;

    const hostelSnap = await admin.firestore().doc(`hostels/${hostelSlug}`).get();
    const hostel = hostelSnap.data() || {};
    const hostelName = (hostel.name as string) || hostelSlug;
    const contactEmail = hostel.contactEmail as string | undefined;

    const resend = new Resend(RESEND_API_KEY.value());

    // 1) mail al huésped (pending)
    await resend.emails.send({
      from: FROM,
      to: r.email,
      subject: `Recibimos tu reserva en ${hostelName}`,
      html: baseEmailHtml(
        "Reserva recibida",
        `
        <p>Hola <strong>${r.fullName || ""}</strong>,</p>
        <p>Recibimos tu solicitud de reserva. Te vamos a confirmar a la brevedad.</p>
        <p><strong>Detalle</strong><br/>
          Habitación: ${r.roomName}<br/>
          Check-in: ${fmtDate(r.checkIn)}<br/>
          Check-out: ${fmtDate(r.checkOut)}<br/>
          Noches: ${r.nights ?? "-"}<br/>
          Total: $${r.total ?? 0}
        </p>
        `
      ),
    });

    // 2) mail al hostel (si existe contactEmail)
    if (contactEmail) {
      await resend.emails.send({
        from: FROM,
        to: contactEmail,
        subject: `Nueva reserva pendiente – ${hostelName}`,
        html: baseEmailHtml(
          "Nueva reserva pendiente",
          `
          <p>Nueva solicitud:</p>
          <p>
            Huésped: <strong>${r.fullName}</strong><br/>
            Email: ${r.email}<br/>
            Habitación: ${r.roomName}<br/>
            Check-in: ${fmtDate(r.checkIn)}<br/>
            Check-out: ${fmtDate(r.checkOut)}<br/>
            Total: $${r.total ?? 0}<br/>
            Estado: ${r.status}
          </p>
          <p style="font-size:13px; color:#9ca3af;">Entrá al panel para confirmarla o cancelarla.</p>
          `
        ),
      });
    }
  }
);

export const onReservationStatusChangedSendEmail = onDocumentUpdated(
  {
    document: "hostels/{hostelSlug}/reservations/{reservationId}",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const before = event.data?.before.data() as any;
    const after = event.data?.after.data() as any;
    if (!before || !after) return;

    if (before.status === after.status) return;
    if (!after.email) return;

    const hostelSlug = event.params.hostelSlug as string;
    const hostelSnap = await admin.firestore().doc(`hostels/${hostelSlug}`).get();
    const hostel = hostelSnap.data() || {};
    const hostelName = (hostel.name as string) || hostelSlug;

    const resend = new Resend(RESEND_API_KEY.value());

    if (after.status === "confirmed") {
      await resend.emails.send({
        from: FROM,
        to: after.email,
        subject: `Tu reserva fue confirmada – ${hostelName}`,
        html: baseEmailHtml(
          "Reserva confirmada",
          `
          <p>Hola <strong>${after.fullName || ""}</strong>,</p>
          <p>¡Listo! Tu reserva fue <strong>confirmada</strong>.</p>
          <p><strong>Detalle</strong><br/>
            Habitación: ${after.roomName}<br/>
            Check-in: ${fmtDate(after.checkIn)}<br/>
            Check-out: ${fmtDate(after.checkOut)}<br/>
            Total: $${after.total ?? 0}
          </p>
          `
        ),
      });
    }

    if (after.status === "cancelled") {
      await resend.emails.send({
        from: FROM,
        to: after.email,
        subject: `Tu reserva fue cancelada – ${hostelName}`,
        html: baseEmailHtml(
          "Reserva cancelada",
          `
          <p>Hola <strong>${after.fullName || ""}</strong>,</p>
          <p>Tu reserva fue <strong>cancelada</strong>.</p>
          <p><strong>Detalle</strong><br/>
            Habitación: ${after.roomName}<br/>
            Check-in: ${fmtDate(after.checkIn)}<br/>
            Check-out: ${fmtDate(after.checkOut)}
          </p>
          `
        ),
      });
    }
  }
);