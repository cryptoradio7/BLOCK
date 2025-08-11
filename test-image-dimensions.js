// Test du système de dimensions d'images
// Exécuter avec : node test-image-dimensions.js

const testImageDimensions = async () => {
  console.log('🧪 Test du système de dimensions d\'images...\n');

  // Test 1: Vérifier l'API
  try {
    console.log('📡 Test 1: Vérification de l\'API /api/image-dimensions');
    const response = await fetch('http://localhost:3000/api/image-dimensions');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API accessible, données récupérées:', data.length, 'entrées');
    } else {
      console.log('❌ API inaccessible, status:', response.status);
    }
  } catch (error) {
    console.log('❌ Erreur API:', error.message);
  }

  // Test 2: Vérifier la base de données
  try {
    console.log('\n🗄️ Test 2: Vérification de la table image_dimensions');
    const response = await fetch('http://localhost:3000/api/image-dimensions?blockId=1');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Table accessible, dimensions pour bloc 1:', data.length, 'entrées');
      if (data.length > 0) {
        console.log('📊 Exemple de données:', data[0]);
      }
    } else {
      console.log('❌ Table inaccessible, status:', response.status);
    }
  } catch (error) {
    console.log('❌ Erreur table:', error.message);
  }

  // Test 3: Vérifier la création de dimensions
  try {
    console.log('\n➕ Test 3: Test de création de dimensions');
    const testData = {
      block_id: 999,
      image_url: '/test/image.jpg',
      image_name: 'Test Image',
      width: 400,
      height: 300,
      original_width: 800,
      original_height: 600
    };

    const response = await fetch('http://localhost:3000/api/image-dimensions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Création réussie:', result);
      
      // Nettoyer le test
      await fetch(`http://localhost:3000/api/image-dimensions?blockId=999&imageUrl=${encodeURIComponent('/test/image.jpg')}`, {
        method: 'DELETE'
      });
      console.log('🧹 Test nettoyé');
    } else {
      console.log('❌ Création échouée, status:', response.status);
    }
  } catch (error) {
    console.log('❌ Erreur création:', error.message);
  }

  console.log('\n🎯 Résumé des tests terminé !');
  console.log('📋 Vérifiez que :');
  console.log('   - L\'application fonctionne sur localhost:3000');
  console.log('   - La base de données est accessible');
  console.log('   - Les tables sont créées');
};

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testImageDimensions().catch(console.error);
}

module.exports = { testImageDimensions };
