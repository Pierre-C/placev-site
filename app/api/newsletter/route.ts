// app/api/newsletter/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as brevo from "@getbrevo/brevo";

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName } = await request.json();

    // Validation basique
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Configuration de l'API Brevo
    const apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(
      brevo.ContactsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY || ""
    );

    // Création du contact dans Brevo
    const createContact = new brevo.CreateContact();
    createContact.email = email;

    // Attributs optionnels
    if (firstName || lastName) {
      createContact.attributes = {
        PRENOM: firstName || "",
        NOM: lastName || "",
      };
    }

    // Liste IDs (à configurer dans vos variables d'environnement)
    // Vous pouvez trouver vos IDs de liste dans Brevo > Contacts > Listes
    const listIds = process.env.BREVO_LIST_IDS
      ? JSON.parse(process.env.BREVO_LIST_IDS)
      : [];

    if (listIds.length > 0) {
      createContact.listIds = listIds;
    }

    // Ajout du contact
    await apiInstance.createContact(createContact);

    return NextResponse.json(
      { message: "Inscription réussie !" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'inscription à la newsletter:", error);

    // Log détaillé pour déboguer
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response body:", JSON.stringify(error.response.body));
    }

    // Gestion des erreurs Brevo spécifiques - plusieurs formats possibles
    const errorBody = error.response?.body;
    const errorCode = errorBody?.code || error.code;
    const errorMessage = errorBody?.message || error.message || "";

    // Détection du doublon via différentes méthodes
    const isDuplicate =
      errorCode === "duplicate_parameter" ||
      errorMessage.toLowerCase().includes("duplicate") ||
      errorMessage.toLowerCase().includes("already exist") ||
      errorMessage.toLowerCase().includes("déjà") ||
      (error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("contact"));

    if (isDuplicate) {
      return NextResponse.json(
        {
          error: "Vous êtes déjà inscrit à notre newsletter !",
          isDuplicate: true,
        },
        { status: 409 } // 409 Conflict est plus approprié pour un doublon
      );
    }

    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de l'inscription",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
