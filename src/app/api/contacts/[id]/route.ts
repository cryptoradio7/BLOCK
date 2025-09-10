import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ProfessionalContact } from '../../../../types/contacts';
import { EmailReconstructor } from '../../../../lib/emailReconstruction';
import { PhoneSearcher } from '../../../../lib/phoneSearch';

// GET /api/contacts/[id] - Récupérer un contact spécifique
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
    
    const result = await sql.query(
      'SELECT * FROM professional_contacts WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contact non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
    
  } catch (error) {
    console.error('Erreur lors de la récupération du contact:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du contact' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Mettre à jour un contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const updates: Partial<ProfessionalContact> = body;
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de contact invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier que le contact existe
    const existingContact = await sql.query(
      'SELECT * FROM professional_contacts WHERE id = $1',
      [id]
    );
    
    if (existingContact.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contact non trouvé' },
        { status: 404 }
      );
    }
    
    // Construire la requête de mise à jour
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Champs à mettre à jour
    const fieldsToUpdate = [
      'nom', 'prenom', 'entreprise', 'intitule_poste', 'pays', 'region', 'ville',
      'code_postal', 'adresse', 'email', 'email_reconstruit', 'telephone',
      'telephone_mobile', 'linkedin_url', 'site_web_entreprise',
      'taille_entreprise', 'secteur_activite', 'description_entreprise',
      'source_donnees', 'confiance_email', 'confiance_telephone',
      'notes', 'tags', 'statut', 'date_derniere_verification', 'verifie_par'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (updates[field as keyof ProfessionalContact] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(updates[field as keyof ProfessionalContact]);
        paramIndex++;
      }
    });
    
    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'Aucun champ à mettre à jour' },
        { status: 400 }
      );
    }
    
    // Ajouter l'ID à la fin
    values.push(id);
    
    const updateQuery = `
      UPDATE professional_contacts 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await sql.query(updateQuery, values);
    
    return NextResponse.json(result.rows[0]);
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contact:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du contact' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Supprimer un contact
export async function DELETE(
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
    
    // Vérifier que le contact existe
    const existingContact = await sql.query(
      'SELECT * FROM professional_contacts WHERE id = $1',
      [id]
    );
    
    if (existingContact.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contact non trouvé' },
        { status: 404 }
      );
    }
    
    // Supprimer le contact (les tentatives seront supprimées automatiquement par CASCADE)
    await sql.query('DELETE FROM professional_contacts WHERE id = $1', [id]);
    
    return NextResponse.json({ message: 'Contact supprimé avec succès' });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du contact:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du contact' },
      { status: 500 }
    );
  }
}












