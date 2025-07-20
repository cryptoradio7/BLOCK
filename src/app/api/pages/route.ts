import { NextRequest, NextResponse } from 'next/server'
import { Page } from '@/types'

// Simulation d'une base de données en mémoire
let pages: Page[] = [
  {
    id: '1',
    title: 'Page d\'accueil',
    blocks: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export async function GET() {
  return NextResponse.json(pages)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      )
    }

    const newPage: Page = {
      id: Date.now().toString(),
      title,
      blocks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    pages.push(newPage)

    return NextResponse.json(newPage, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création de la page' },
      { status: 500 }
    )
  }
} 