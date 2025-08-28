import { NextRequest, NextResponse } from 'next/server'
import { runMigration } from '@/lib/plugins/database'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Read the migration file
    const migrationPath = resolve(process.cwd(), 'packages/services/soundscapes/migrations/0001_create_soundscapes_table.sql')
    const migrationSql = await readFile(migrationPath, 'utf-8')
    
    // Run the migration
    const result = await runMigration(migrationSql, 'soundscapes_0001_create_soundscapes_table')
    
    return NextResponse.json({
      success: true,
      message: 'Soundscapes migration completed',
      result
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    }, { status: 500 })
  }
}
