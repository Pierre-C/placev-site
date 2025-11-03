// scripts/optimize-gallery.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, '../public/gallery');
const outputDir = path.join(__dirname, '../public/gallery-optimized');

// Dimensions cibles : 
// - Desktop (4 colonnes) : ~400px de largeur
// - Hauteur fixe : 224px (h-56 = 14rem = 224px)
const TARGET_WIDTH = 600;  // Un peu plus pour la qualité
const TARGET_HEIGHT = 400; // Ratio 3:2

async function optimizeImages() {
  // Créer le dossier de sortie s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Lire tous les fichiers du dossier gallery
  const files = fs.readdirSync(galleryDir).filter(file => 
    /\.(jpg|jpeg|png)$/i.test(file)
  );

  console.log(`🖼️  Optimisation de ${files.length} images...\n`);

  for (const file of files) {
    const inputPath = path.join(galleryDir, file);
    const outputPath = path.join(outputDir, file);

    try {
      const metadata = await sharp(inputPath).metadata();
      console.log(`📸 ${file}`);
      console.log(`   Avant: ${metadata.width}x${metadata.height} (${(metadata.size / 1024).toFixed(0)} KB)`);

      await sharp(inputPath)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputPath);

      const newMetadata = await sharp(outputPath).metadata();
      const savings = ((1 - newMetadata.size / metadata.size) * 100).toFixed(0);
      console.log(`   Après: ${newMetadata.width}x${newMetadata.height} (${(newMetadata.size / 1024).toFixed(0)} KB) - ${savings}% de réduction\n`);
    } catch (error) {
      console.error(`❌ Erreur avec ${file}:`, error.message);
    }
  }

  console.log(`✅ Optimisation terminée !`);
  console.log(`📁 Images optimisées dans: ${outputDir}`);
  console.log(`\n💡 Pour remplacer les images originales:`);
  console.log(`   rm -rf public/gallery/*`);
  console.log(`   mv public/gallery-optimized/* public/gallery/`);
  console.log(`   rmdir public/gallery-optimized`);
}

optimizeImages().catch(console.error);

