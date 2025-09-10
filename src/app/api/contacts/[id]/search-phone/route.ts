import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { PhoneSearcher } from '../../../../../lib/phoneSearch';
import { PhoneSearchAttempt } from '../../../../../types/contacts';

// POST /api/contacts/[id]/search-phone - Rechercher le téléphone d'un contact
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de contact invalide' },
        { status: 400 }
      );
    }
    
    // Récupérer le contact
    const contactResult = await sql.query(
      'SELECT * FROM professional_contacts WHERE id = $1',
      [id]
    );
    
    if (contactResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contact non trouvé' },
        { status: 404 }
      );
    }
    
    const contact = contactResult.rows[0];
    
    // Rechercher le numéro de téléphone
    const phoneResults = await PhoneSearcher.searchPhoneNumber(contact);
    
    // Enregistrer les tentatives de recherche
    const attempts: PhoneSearchAttempt[] = [];
    
    for (const result of phoneResults) {
      const attempt: PhoneSearchAttempt = {
        contact_id: id,
        service_utilise: result.service_utilise,
        telephone_trouve: result.telephone || null,
        resultat: result.telephone ? 'succes' : 'echec',
        source_url: result.source_url || null,
        notes: `Recherche automatique via ${result.service_utilise}`
      };
      
      // Insérer la tentative
      await sql.query(
        `INSERT INTO phone_search_attempts 
         (contact_id, service_utilise, telephone_trouve, resultat, source_url, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          attempt.contact_id,
          attempt.service_utilise,
          attempt.telephone_trouve,
          attempt.resultat,
          attempt.source_url,
          attempt.notes
        ]
      );
      
      attempts.push(attempt);
    }
    
    // Si on a trouvé un numéro, mettre à jour le contact
    const bestResult = phoneResults
      .filter(r => r.telephone)
      .sort((a, b) => (b.confiance || 0) - (a.confiance || 0))[0];
    
    if (bestResult && bestResult.telephone) {
      // Formater le numéro selon le pays
      const formattedPhone = PhoneSearcher.formatPhoneNumber(
        bestResult.telephone, 
        contact.pays || 'Luxembourg'
      );
      
      // Calculer la confiance
      const confidence = PhoneSearcher.calculatePhoneConfidence(
        contact,
        bestResult.telephone,
        bestResult.service_utilise
      );
      
      // Mettre à jour le contact
      await sql.query(
        `UPDATE professional_contacts 
         SET telephone = $1, confiance_telephone = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [formattedPhone, confidence, id]
      );
      
      // Récupérer le contact mis à jour
      const updatedContactResult = await sql.query(
        'SELECT * FROM professional_contacts WHERE id = $1',
        [id]
      );
      
      return NextResponse.json({
        contact: updatedContactResult.rows[0],
        search_results: phoneResults,
        attempts: attempts,
        best_result: bestResult
      });
    }
    
    return NextResponse.json({
      contact: contact,
      search_results: phoneResults,
      attempts: attempts,
      message: 'Aucun numéro de téléphone trouvé'
    });
    
  } catch (error) {
    console.error('Erreur lors de la recherche de téléphone:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche de téléphone' },
      { status: 500 }
    );
  }
}

// GET /api/contacts/[id]/search-phone - Obtenir l'historique des recherches
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de contact invalide' },
        { status: 400 }
      );
    }
    
    // Récupérer l'historique des recherches
    const attemptsResult = await sql.query(
      `SELECT * FROM phone_search_attempts 
       WHERE contact_id = $1 
       ORDER BY date_recherche DESC`,
      [id]
    );
    
    return NextResponse.json({
      attempts: attemptsResult.rows
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des recherches:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des recherches' },
      { status: 500 }
    );
  }
}












