import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageId, format = 'A4' } = body

    if (!pageId) {
      return NextResponse.json(
        { error: 'L\'ID de la page est requis' },
        { status: 400 }
      )
    }

    // Simulation de la génération PDF
    // En production, vous utiliseriez le contenu réel de la page
    const doc = new jsPDF({
      format: format as 'A4' | 'A3' | 'letter',
      unit: 'mm'
    })

    doc.setFontSize(20)
    doc.text('Export PDF - Page', 20, 20)
    
    doc.setFontSize(12)
    doc.text(`Page ID: ${pageId}`, 20, 40)
    doc.text(`Format: ${format}`, 20, 50)
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 60)

    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="page-${pageId}.pdf"`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
} 