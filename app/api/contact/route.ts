// app/api/contact/route.ts
import { NextResponse } from 'next/server'
import * as brevo from '@getbrevo/brevo'

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    // Validation basique
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Vérification de la clé API
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      console.error('BREVO_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    // Configuration de l'API Brevo
    const apiInstance = new brevo.TransactionalEmailsApi()
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey)

    // Préparation de l'email
    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.subject = `[PlaceV] Nouveau message de ${name}`
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0A6CFF;">Nouveau message de contact - PlaceV</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Nom :</strong> ${name}</p>
          <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Message :</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <p style="color: #666; font-size: 12px;">
          Message reçu via le formulaire de contact du site PlaceV Coworking
        </p>
      </div>
    `
    sendSmtpEmail.sender = {
      name: 'PlaceV Website',
      email: 'noreply@placev.fr'
    }
    sendSmtpEmail.to = [
      { email: process.env.CONTACT_EMAIL || 'contact@placev.fr', name: 'PlaceV' }
    ]
    sendSmtpEmail.replyTo = { email, name }

    // Envoi de l'email via Brevo
    await apiInstance.sendTransacEmail(sendSmtpEmail)

    return NextResponse.json({
      ok: true,
      message: 'Message envoyé avec succès'
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    )
  }
}
