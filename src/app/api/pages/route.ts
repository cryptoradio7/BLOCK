import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { Page } from '@/types'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.created_at as "createdAt",
        p.updated_at as "updatedAt"
      FROM pages p
      ORDER BY p.updated_at DESC
    `)
    
    const pages: Page[] = result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }))

    return NextResponse.json(pages)
  } catch (error) {
    console.error('Erreur lors de la récupération des pages:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pages' },
      { status: 500 }
    )
  }
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

    const result = await pool.query(
      'INSERT INTO pages (title) VALUES ($1) RETURNING *',
      [title]
    )

    const newPage: Page = {
      id: result.rows[0].id.toString(),
      title: result.rows[0].title,
      createdAt: new Date(result.rows[0].created_at),
      updatedAt: new Date(result.rows[0].updated_at)
    }

    return NextResponse.json(newPage, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la page:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la page' },
      { status: 500 }
    )
  }
} 