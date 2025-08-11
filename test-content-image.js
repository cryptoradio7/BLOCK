// Test pour vérifier que les images du contenu ne créent plus d'attachments
// Exécuter après avoir redémarré l'application

const testContentImageUpload = async () => {
  console.log('🧪 Test: Images du contenu sans attachments...\n');

  try {
    // Simuler l'upload d'une image de contenu
    console.log('📤 Test 1: Upload d\'image de contenu...');
    
    // Créer un fichier de test
    const testFile = new File(['test image content'], 'test-content-image.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('blockId', '1');

    const response = await fetch('http://localhost:3001/api/upload-content-image', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload réussi !');
      console.log('📊 Résultat:', result);
      
      // Vérifier que c'est bien marqué comme image de contenu
      if (result.isContentImage) {
        console.log('✅ Image correctement marquée comme image de contenu');
      } else {
        console.log('❌ Image non marquée comme image de contenu');
      }
      
      // Vérifier qu'il n'y a pas d'ID d'attachment
      if (result.id === null) {
        console.log('✅ Pas d\'ID d\'attachment créé (correct)');
      } else {
        console.log('❌ ID d\'attachment créé (incorrect)');
      }
      
      // Vérifier que les dimensions sont créées
      console.log('\n📏 Test 2: Vérification des dimensions...');
      const dimensionsResponse = await fetch(`http://localhost:3001/api/image-dimensions?blockId=1`);
      
      if (dimensionsResponse.ok) {
        const dimensions = await dimensionsResponse.json();
        const imageDimensions = dimensions.find(d => d.image_url === result.url);
        
        if (imageDimensions) {
          console.log('✅ Dimensions créées en base');
          console.log('📊 Détails:', imageDimensions);
          
          // Vérifier qu'il n'y a pas d'attachment_id
          if (imageDimensions.attachment_id === null) {
            console.log('✅ Pas d\'attachment_id (correct)');
          } else {
            console.log('❌ attachment_id présent (incorrect)');
          }
        } else {
          console.log('❌ Dimensions non trouvées en base');
        }
      }
      
      // Nettoyer le test
      console.log('\n🧹 Nettoyage du test...');
      await fetch(`http://localhost:3001/api/image-dimensions?blockId=1&imageUrl=${encodeURIComponent(result.url)}`, {
        method: 'DELETE'
      });
      console.log('✅ Test nettoyé');
      
    } else {
      console.log('❌ Upload échoué, status:', response.status);
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }

  console.log('\n🎯 Test terminé !');
  console.log('📋 Résultat attendu :');
  console.log('   - Image uploadée ✅');
  console.log('   - Pas d\'attachment créé ✅');
  console.log('   - Dimensions sauvegardées ✅');
};

// Exécuter le test
testContentImageUpload();
