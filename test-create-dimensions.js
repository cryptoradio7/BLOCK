// Test de création de dimensions d'images
// Exécuter pour vérifier que le système fonctionne

const testCreateDimensions = async () => {
  console.log('🧪 Test de création de dimensions d\'images...\n');

  try {
    // Test 1: Créer des dimensions d'image
    console.log('➕ Test 1: Création de dimensions d\'image...');
    const testData = {
      block_id: 1,
      image_url: '/uploads/test-image.jpg',
      image_name: 'Test Image',
      width: 400,
      height: 300,
      original_width: 800,
      original_height: 600
    };

    const createResponse = await fetch('http://localhost:3001/api/image-dimensions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Création réussie !');
      console.log('📊 Données créées:', result);
      
      // Test 2: Récupérer les dimensions créées
      console.log('\n📥 Test 2: Récupération des dimensions...');
      const getResponse = await fetch('http://localhost:3001/api/image-dimensions?blockId=1');
      
      if (getResponse.ok) {
        const data = await getResponse.json();
        console.log('✅ Récupération réussie !');
        console.log('📊 Dimensions trouvées:', data.length);
        console.log('📋 Détails:', data);
        
        // Test 3: Supprimer les dimensions de test
        console.log('\n🗑️ Test 3: Suppression des dimensions de test...');
        const deleteResponse = await fetch(`http://localhost:3001/api/image-dimensions?blockId=1&imageUrl=${encodeURIComponent('/uploads/test-image.jpg')}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log('✅ Suppression réussie !');
        } else {
          console.log('❌ Erreur lors de la suppression');
        }
      } else {
        console.log('❌ Erreur lors de la récupération');
      }
    } else {
      console.log('❌ Erreur lors de la création');
      const errorText = await createResponse.text();
      console.log('Détails:', errorText);
    }
  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
  }

  console.log('\n🎯 Test terminé !');
};

// Exécuter le test
testCreateDimensions();
