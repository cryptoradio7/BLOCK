import { NextRequest, NextResponse } from 'next/server';

// #region agent log
const log = (location: string, message: string, data: any) => {
  fetch('http://127.0.0.1:7243/ingest/485b1759-96a2-4c35-aaf6-063ed38ff96c', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A'
    })
  }).catch(() => {});
};
// #endregion

export async function POST(request: NextRequest) {
  // #region agent log
  log('api/email/send:entry', 'API send email appelée', {});
  // #endregion

  try {
    const body = await request.json();
    
    // #region agent log
    log('api/email/send:body', 'Body reçu', { 
      hasEmail: !!body.email,
      hasExpediteur: !!body.expediteur,
      hasSujet: !!body.sujet,
      hasMessage: !!body.message
    });
    // #endregion

    const { email, expediteur, sujet, message } = body;

    // Validation
    if (!email || !expediteur || !sujet || !message) {
      // #region agent log
      log('api/email/send:validation', 'Validation échouée', { email, expediteur, sujet, message });
      // #endregion
      return NextResponse.json(
        { success: false, error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // #region agent log
    log('api/email/send:beforeSend', 'Avant envoi email', { email, expediteur, sujet });
    // #endregion

    // Pour l'instant, on simule l'envoi d'email
    // Dans un vrai cas, on utiliserait un service comme SendGrid, Nodemailer, etc.
    // Ici, on retourne juste un succès pour tester
    
    // #region agent log
    log('api/email/send:success', 'Email envoyé avec succès', { email, sujet });
    // #endregion

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès'
    });

  } catch (error) {
    // #region agent log
    log('api/email/send:error', 'Erreur lors de l\'envoi', { error: String(error) });
    // #endregion
    
    console.error('Erreur lors de l\'envoi d\'email:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'envoi d\'email' },
      { status: 500 }
    );
  }
}



