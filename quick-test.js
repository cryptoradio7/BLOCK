// Test rapide de l'API image-dimensions
// Exécuter après avoir créé la table en base

const testAPI = async () => {
  console.log('🧪 Test rapide de l\'API...\n');

  try {
    // Test 1: Vérifier que l'API répond
    console.log('📡 Test de l\'API /api/image-dimensions...');
    const response = await fetch('http://localhost:3001/api/image-dimensions');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API accessible ! Données récupérées:', data.length);
    } else {
      console.log('❌ API inaccessible, status:', response.status);
      console.log('💡 Vérifiez que :');
      console.log('   - L\'application tourne sur localhost:3000');
      console.log('   - La table image_dimensions existe en base');
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    console.log('💡 Vérifiez que l\'application est démarrée');
  }
};

// Exécuter le test
testAPI();
