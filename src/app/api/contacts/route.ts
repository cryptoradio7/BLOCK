import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ProfessionalContact, ContactSearchParams } from '../../../types/contacts';
import { EmailReconstructor } from '../../../lib/emailReconstruction';
import { PhoneSearcher } from '../../../lib/phoneSearch';

// GET /api/contacts - Récupérer tous les contacts avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de recherche
    const query = searchParams.get('query');
    const pays = searchParams.get('pays');
    const entreprise = searchParams.get('entreprise');
    const statut = searchParams.get('statut');
    const has_email = searchParams.get('has_email');
    const has_telephone = searchParams.get('has_telephone');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';
    
    // Construire la requête SQL
    let sqlQuery = `
      SELECT 
        id, nom, prenom, nom_complet, entreprise, intitule_poste,
        pays, region, ville, code_postal, adresse,
        email, email_reconstruit, telephone, telephone_mobile,
        linkedin_url, site_web_entreprise, taille_entreprise,
        secteur_activite, description_entreprise, source_donnees,
        confiance_email, confiance_telephone, notes, tags,
        statut, date_derniere_verification, verifie_par,
        created_at, updated_at
      FROM professional_contacts
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // Filtres
    if (query) {
      sqlQuery += ` AND (
        nom ILIKE $${paramIndex} OR 
        prenom ILIKE $${paramIndex} OR 
        entreprise ILIKE $${paramIndex} OR 
        intitule_poste ILIKE $${paramIndex}
      )`;
      params.push(`%${query}%`);
      paramIndex++;
    }
    
    if (pays) {
      sqlQuery += ` AND pays = $${paramIndex}`;
      params.push(pays);
      paramIndex++;
    }
    
    if (entreprise) {
      sqlQuery += ` AND entreprise ILIKE $${paramIndex}`;
      params.push(`%${entreprise}%`);
      paramIndex++;
    }
    
    if (statut) {
      sqlQuery += ` AND statut = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }
    
    if (has_email === 'true') {
      sqlQuery += ` AND (email IS NOT NULL OR email_reconstruit IS NOT NULL)`;
    } else if (has_email === 'false') {
      sqlQuery += ` AND email IS NULL AND email_reconstruit IS NULL`;
    }
    
    if (has_telephone === 'true') {
      sqlQuery += ` AND (telephone IS NOT NULL OR telephone_mobile IS NOT NULL)`;
    } else if (has_telephone === 'false') {
      sqlQuery += ` AND telephone IS NULL AND telephone_mobile IS NULL`;
    }
    
    // Tri
    sqlQuery += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    
    // Pagination
    const offset = (page - 1) * limit;
    sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    // Exécuter la requête
    const result = await sql.query(sqlQuery, params);
    
    // Compter le total pour la pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM professional_contacts
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    paramIndex = 1;
    
    if (query) {
      countQuery += ` AND (
        nom ILIKE $${paramIndex} OR 
        prenom ILIKE $${paramIndex} OR 
        entreprise ILIKE $${paramIndex} OR 
        intitule_poste ILIKE $${paramIndex}
      )`;
      countParams.push(`%${query}%`);
      paramIndex++;
    }
    
    if (pays) {
      countQuery += ` AND pays = $${paramIndex}`;
      countParams.push(pays);
      paramIndex++;
    }
    
    if (entreprise) {
      countQuery += ` AND entreprise ILIKE $${paramIndex}`;
      countParams.push(`%${entreprise}%`);
      paramIndex++;
    }
    
    if (statut) {
      countQuery += ` AND statut = $${paramIndex}`;
      countParams.push(statut);
      paramIndex++;
    }
    
    if (has_email === 'true') {
      countQuery += ` AND (email IS NOT NULL OR email_reconstruit IS NOT NULL)`;
    } else if (has_email === 'false') {
      countQuery += ` AND email IS NULL AND email_reconstruit IS NULL`;
    }
    
    if (has_telephone === 'true') {
      countQuery += ` AND (telephone IS NOT NULL OR telephone_mobile IS NOT NULL)`;
    } else if (has_telephone === 'false') {
      countQuery += ` AND telephone IS NULL AND telephone_mobile IS NULL`;
    }
    
    const countResult = await sql.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    return NextResponse.json({
      contacts: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des contacts' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Créer un nouveau contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contact: ProfessionalContact = body;
    
    // Validation des champs obligatoires
    if (!contact.nom || !contact.entreprise) {
      return NextResponse.json(
        { error: 'Le nom et l\'entreprise sont obligatoires' },
        { status: 400 }
      );
    }
    
    // Insérer le contact
    const insertQuery = `
      INSERT INTO professional_contacts (
        nom, prenom, entreprise, intitule_poste, pays, region, ville,
        code_postal, adresse, email, email_reconstruit, telephone,
        telephone_mobile, linkedin_url, site_web_entreprise,
        taille_entreprise, secteur_activite, description_entreprise,
        source_donnees, confiance_email, confiance_telephone,
        notes, tags, statut
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *
    `;
    
    const result = await sql.query(insertQuery, [
      contact.nom,
      contact.prenom || null,
      contact.entreprise,
      contact.intitule_poste || null,
      contact.pays || 'Luxembourg',
      contact.region || null,
      contact.ville || null,
      contact.code_postal || null,
      contact.adresse || null,
      contact.email || null,
      contact.email_reconstruit || null,
      contact.telephone || null,
      contact.telephone_mobile || null,
      contact.linkedin_url || null,
      contact.site_web_entreprise || null,
      contact.taille_entreprise || null,
      contact.secteur_activite || null,
      contact.description_entreprise || null,
      contact.source_donnees || 'import_manuel',
      contact.confiance_email || 0,
      contact.confiance_telephone || 0,
      contact.notes || null,
      contact.tags || [],
      contact.statut || 'actif'
    ]);
    
    const newContact = result.rows[0];
    
    // Si on a un site web d'entreprise, essayer de reconstruire l'email
    if (contact.site_web_entreprise && !contact.email) {
      try {
        // Récupérer les patterns d'emails
        const patternsResult = await sql.query('SELECT * FROM email_patterns');
        const patterns = patternsResult.rows;
        
        const emailResult = await EmailReconstructor.reconstructEmail(newContact, patterns);
        
        if (emailResult) {
          // Mettre à jour le contact avec l'email reconstruit
          await sql.query(
            'UPDATE professional_contacts SET email_reconstruit = $1, confiance_email = $2 WHERE id = $3',
            [emailResult.email, emailResult.confiance, newContact.id]
          );
          
          newContact.email_reconstruit = emailResult.email;
          newContact.confiance_email = emailResult.confiance;
        }
      } catch (error) {
        console.error('Erreur lors de la reconstruction d\'email:', error);
      }
    }
    
    return NextResponse.json(newContact, { status: 201 });
    
  } catch (error) {
    console.error('Erreur lors de la création du contact:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du contact' },
      { status: 500 }
    );
  }
}












