// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as brevo from "@getbrevo/brevo";

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message } = await request.json();

    // Validation basique
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Le message doit contenir au moins 10 caractères" },
        { status: 400 }
      );
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Veuillez indiquer votre nom" },
        { status: 400 }
      );
    }

    // Configuration de l'API Brevo pour les emails transactionnels
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY || ""
    );

    // Préparation de l'email
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: "PlaceV Coworking",
      email: "placevcoworking@gmail.com",
    };
    sendSmtpEmail.to = [
      {
        email: "placevcoworking@gmail.com",
        name: "PlaceV Coworking",
      },
    ];
    sendSmtpEmail.replyTo = {
      email: email,
      name: name,
    };
    sendSmtpEmail.subject = `Nouveau message de contact - ${name}`;
    sendSmtpEmail.htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #006AFE; border-bottom: 2px solid #4FD1C5; padding-bottom: 10px;">
              Nouveau message de contact
            </h2>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nom :</strong> ${name}</p>
              <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
              ${phone ? `<p><strong>Téléphone :</strong> ${phone}</p>` : ""}
            </div>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #333;">Message :</h3>
              <p style="background: white; padding: 15px; border-left: 4px solid #4FD1C5; margin: 10px 0;">
                ${message.replace(/\n/g, "<br>")}
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p>Ce message a été envoyé depuis le formulaire de contact du site PlaceV.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Envoi de l'email
    await apiInstance.sendTransacEmail(sendSmtpEmail);

    return NextResponse.json(
      {
        message: "Message envoyé avec succès ! Nous vous répondrons rapidement.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'envoi du message de contact:", error);

    // Log détaillé pour déboguer
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response body:", JSON.stringify(error.response.body));
    }

    const errorMessage = error.response?.body?.message || error.message || "";

    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de l'envoi du message",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

