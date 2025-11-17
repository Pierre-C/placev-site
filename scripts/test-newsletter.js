// Script de test pour la newsletter
// Usage: node scripts/test-newsletter.js

const testEmail = "test-newsletter@example.com";

async function testNewsletter() {
  console.log("🧪 Test de l'API Newsletter...\n");

  // Test 1 : Première inscription
  console.log("📝 Test 1 : Première inscription");
  try {
    const response1 = await fetch("http://localhost:3000/api/newsletter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        firstName: "Test",
      }),
    });

    const data1 = await response1.json();
    console.log(`Status: ${response1.status}`);
    console.log(`Response:`, data1);
    console.log(
      response1.ok
        ? "✅ Inscription réussie"
        : "❌ Erreur lors de l'inscription"
    );
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 2 : Doublon (même email)
  console.log("📝 Test 2 : Tentative de doublon");
  try {
    const response2 = await fetch("http://localhost:3000/api/newsletter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        firstName: "Test",
      }),
    });

    const data2 = await response2.json();
    console.log(`Status: ${response2.status}`);
    console.log(`Response:`, data2);

    if (response2.status === 409) {
      console.log("✅ Doublon correctement détecté (status 409)");
      console.log(`🟠 Message: ${data2.error}`);
    } else if (data2.isDuplicate) {
      console.log("✅ Doublon détecté via flag isDuplicate");
    } else {
      console.log(
        "⚠️ Doublon pas détecté - vérifiez les logs du serveur dans votre terminal"
      );
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }

  console.log("\n" + "=".repeat(50) + "\n");
  console.log(
    "💡 Conseil: Regardez aussi les logs dans le terminal où tourne 'yarn dev'"
  );
  console.log(
    "💡 Vous devriez voir les détails de l'erreur Brevo dans ces logs"
  );
}

// Vérification que le serveur tourne
fetch("http://localhost:3000/api/newsletter")
  .then(() => testNewsletter())
  .catch(() => {
    console.error(
      "❌ Le serveur ne semble pas tourner sur http://localhost:3000"
    );
    console.error("   Lancez 'yarn dev' d'abord !");
    process.exit(1);
  });
