import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { EmailReconstructor } from '../../../../../lib/emailReconstruction';
import { EmailReconstructionAttempt } from '../../../../../types/contacts';

// POST /api/contacts/[id]/reconstruct-email - Reconstruire l'email d'un contact
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
    
    // Vérifier qu'on a un site web d'entreprise
    if (!contact.site_web_entreprise) {
      return NextResponse.json(
        { error: 'Site web d\'entreprise requis pour la reconstruction d\'email' },
        { status: 400 }
      );
    }
    
    // Récupérer les patterns d'emails
    const patternsResult = await sql.query('SELECT * FROM email_patterns');
    const patterns = patternsResult.rows;
    
    // Reconstruire l'email
    const emailResult = await EmailReconstructor.reconstructEmail(contact, patterns);
    
    if (!emailResult) {
      return NextResponse.json(
        { error: 'Impossible de reconstruire l\'email avec les informations disponibles' },
        { status: 400 }
      );
    }
    
    // Enregistrer la tentative de reconstruction
    const attempt: EmailReconstructionAttempt = {
      contact_id: id,
      pattern_utilise: emailResult.pattern_utilise,
      email_tente: emailResult.email,
      resultat: 'en_cours',
      notes: `Reconstruction automatique avec pattern: ${emailResult.pattern_utilise}`
    };
    
    await sql.query(
      `INSERT INTO email_reconstruction_attempts 
       (contact_id, pattern_utilise, email_tente, resultat, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        attempt.contact_id,
        attempt.pattern_utilise,
        attempt.email_tente,
        attempt.resultat,
        attempt.notes
      ]
    );
    
    // Mettre à jour le contact avec l'email reconstruit
    await sql.query(
      `UPDATE professional_contacts 
       SET email_reconstruit = $1, confiance_email = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [emailResult.email, emailResult.confiance, id]
    );
    
    // Récupérer le contact mis à jour
    const updatedContactResult = await sql.query(
      'SELECT * FROM professional_contacts WHERE id = $1',
      [id]
    );
    
    return NextResponse.json({
      contact: updatedContactResult.rows[0],
      reconstruction: emailResult,
      attempt: attempt
    });
    
  } catch (error) {
    console.error('Erreur lors de la reconstruction d\'email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la reconstruction d\'email' },
      { status: 500 }
    );
  }
}

// GET /api/contacts/[id]/reconstruct-email - Obtenir l'historique des tentatives
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
    
    // Récupérer l'historique des tentatives
    const attemptsResult = await sql.query(
      `SELECT * FROM email_reconstruction_attempts 
       WHERE contact_id = $1 
       ORDER BY date_tentative DESC`,
      [id]
    );
    
    return NextResponse.json({
      attempts: attemptsResult.rows
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des tentatives:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tentatives' },
      { status: 500 }
    );
  }
}












