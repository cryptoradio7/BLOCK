// Test direct de l'API
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Test de l\'API blocks...');
    
    const response = await fetch('http://localhost:3001/api/blocks');
    const data = await response.text();
    
    console.log('📡 Status:', response.status);
    console.log('📄 Response:', data);
    
    if (response.ok) {
      console.log('✅ API fonctionne !');
    } else {
      console.log('❌ Erreur API:', data);
    }
  } catch (error) {
    console.log('💥 Erreur réseau:', error.message);
  }
}

testAPI(); 