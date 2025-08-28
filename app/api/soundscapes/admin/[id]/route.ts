import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkIsAdmin } from '@/lib/admin-adapter'
import { checkIsAdminDirect } from '@/lib/admin-adapter-direct'

// Note: For now this route mirrors the in-package mock admin API under
// packages/services/soundscapes/src/api/admin/[id]/route.ts
// In production, wire to real data layer (Supabase) and shared validators.

// Temporary in-memory store (scoped to server process)
type Soundscape = {
	id: string
	title: string
	description: string
	category: string
	audio_url: string
	thumbnail_url: string
	is_published: boolean
	sort_order: number
	duration_seconds?: number
	created_at?: string
	updated_at?: string
}

const sampleSoundscapes: Soundscape[] = [
	{
		id: '1',
		title: 'Ocean Waves',
		description: 'Peaceful ocean sounds for deep relaxation',
		category: 'Nature',
		audio_url: 'https://www.soundjay.com/misc/sounds/ocean-wave-1.wav',
		thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
		is_published: true,
		sort_order: 1,
		duration_seconds: 1800,
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
	},
]

let soundscapes: Soundscape[] = [...sampleSoundscapes]

async function verifyAdminAccess() {
	const { userId } = await auth()
	if (!userId) return null
	let admin = await checkIsAdmin(userId)
	if (!admin) admin = await checkIsAdminDirect(userId)
	return admin
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const admin = await verifyAdminAccess()
		if (!admin) {
			return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
		}

		const { id } = await params
		const body = await request.json()
		const { title, description, category, audio_url, thumbnail_url, is_published, sort_order } = body

		const idx = soundscapes.findIndex((s) => s.id === id)
		if (idx === -1) {
			return NextResponse.json({ success: false, error: 'Soundscape not found' }, { status: 404 })
		}

		const updated: Soundscape = {
			...soundscapes[idx],
			title: title ?? soundscapes[idx].title,
			description: description ?? soundscapes[idx].description,
			category: category ?? soundscapes[idx].category,
			audio_url: audio_url ?? soundscapes[idx].audio_url,
			thumbnail_url: thumbnail_url ?? soundscapes[idx].thumbnail_url,
			is_published: is_published ?? soundscapes[idx].is_published,
			sort_order: sort_order ?? soundscapes[idx].sort_order,
			updated_at: new Date().toISOString(),
		}
		soundscapes[idx] = updated
		return NextResponse.json({ success: true, data: updated })
	} catch (error) {
		console.error('Soundscapes admin [id] PUT error:', error)
		return NextResponse.json({ success: false, error: 'Failed to update soundscape' }, { status: 500 })
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const admin = await verifyAdminAccess()
		if (!admin) {
			return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
		}

		const { id } = await params
		const idx = soundscapes.findIndex((s) => s.id === id)
		if (idx === -1) {
			return NextResponse.json({ success: false, error: 'Soundscape not found' }, { status: 404 })
		}

		const deleted = soundscapes.splice(idx, 1)[0]
		return NextResponse.json({ success: true, data: deleted })
	} catch (error) {
		console.error('Soundscapes admin [id] DELETE error:', error)
		return NextResponse.json({ success: false, error: 'Failed to delete soundscape' }, { status: 500 })
	}
}

