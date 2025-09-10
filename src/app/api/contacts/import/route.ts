import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ProfessionalContact, ContactImportData } from '../../../../types/contacts';
import { parseContactFromTable } from '../../../../lib/emailReconstruction';

// POST /api/contacts/import - Importer des contacts en masse
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contacts, source = 'import_manuel' } = body;
    
    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json(
        { error: 'Données de contacts invalides' },
        { status: 400 }
      );
    }
    
    const results = {
      total: contacts.length,
      imported: 0,
      errors: 0,
      errors_details: [] as string[],
      contacts_created: [] as ProfessionalContact[]
    };
    
    // Traiter chaque contact
    for (const contactData of contacts) {
      try {
        let contact: ProfessionalContact;
        
        // Si c'est un format de table (comme dans votre image)
        if (contactData.nom && contactData.entreprise) {
          contact = parseContactFromTable(contactData);
        } else {
          // Format standard
          contact = contactData as ProfessionalContact;
        }
        
        // Validation des champs obligatoires
        if (!contact.nom || !contact.entreprise) {
          results.errors++;
          results.errors_details.push(`Contact invalide: nom ou entreprise manquant`);
          continue;
        }
        
        // Vérifier si le contact existe déjà
        const existingContact = await sql.query(
          'SELECT id FROM professional_contacts WHERE nom = $1 AND entreprise = $2',
          [contact.nom, contact.entreprise]
        );
        
        if (existingContact.rows.length > 0) {
          results.errors++;
          results.errors_details.push(`Contact déjà existant: ${contact.nom} chez ${contact.entreprise}`);
          continue;
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
          source,
          contact.confiance_email || 0,
          contact.confiance_telephone || 0,
          contact.notes || null,
          contact.tags || ['import_masse'],
          contact.statut || 'actif'
        ]);
        
        const newContact = result.rows[0];
        results.imported++;
        results.contacts_created.push(newContact);
        
      } catch (error) {
        console.error('Erreur lors de l\'import du contact:', error);
        results.errors++;
        results.errors_details.push(`Erreur technique: ${error}`);
      }
    }
    
    return NextResponse.json({
      message: `Import terminé: ${results.imported} contacts importés, ${results.errors} erreurs`,
      results: results
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'import des contacts' },
      { status: 500 }
    );
  }
}

// GET /api/contacts/import/template - Obtenir un template d'import
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    
    if (format === 'csv') {
      const csvTemplate = `nom,entreprise,intitule_poste,taille_entreprise,site_web_entreprise,linkedin_url,pays,tags
"Stéphane Demeure","ING Luxembourg","CISO","501-1000","http://www.ingjobs.lu","","Luxembourg","CISO,Finance"
"Philippe Mathieu","ArcelorMittal","Group CIO and CISO","10001+","http://corporate.arcelormittal.com","","Luxembourg","CISO,Industrie"`;
      
      return new NextResponse(csvTemplate, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="contacts_template.csv"'
        }
      });
    }
    
    // Format JSON par défaut
    const jsonTemplate = {
      contacts: [
        {
          nom: "Stéphane Demeure",
          entreprise: "ING Luxembourg",
          intitule_poste: "CISO",
          taille_entreprise: "501-1000",
          site_web_entreprise: "http://www.ingjobs.lu",
          pays: "Luxembourg",
          tags: ["CISO", "Finance"]
        },
        {
          nom: "Philippe Mathieu",
          entreprise: "ArcelorMittal",
          intitule_poste: "Group CIO and CISO",
          taille_entreprise: "10001+",
          site_web_entreprise: "http://corporate.arcelormittal.com",
          pays: "Luxembourg",
          tags: ["CISO", "Industrie"]
        }
      ]
    };
    
    return NextResponse.json(jsonTemplate);
    
  } catch (error) {
    console.error('Erreur lors de la génération du template:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du template' },
      { status: 500 }
    );
  }
}












