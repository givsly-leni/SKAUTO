import { supabase } from './supabaseClient'
import type { Vehicle } from './types'

export type UserRole = 'owner' | 'customer'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
}

/** Is there a garage owner yet? Callable before signing in. */
export async function ownerExists(): Promise<boolean> {
  const { data, error } = await supabase.rpc('owner_exists')
  if (error) throw error
  return Boolean(data)
}

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .maybeSingle()

  if (error) throw error
  return (data as Profile) ?? null
}

export interface ClaimResult {
  ok: boolean
  error?: string
  plate?: string
  vehicles?: number
}

/**
 * Link a plate to the signed-in customer. The database checks the plate
 * against the phone number the garage already has on file, so a plate alone
 * is never enough.
 */
export async function claimPlate(
  plate: string,
  phone: string,
): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc('claim_plate', {
    p_plate: plate,
    p_phone: phone,
  })
  if (error) throw error
  return data as ClaimResult
}

export interface ClaimedPlate {
  id: string
  license_plate: string
}

export async function listMyPlates(): Promise<ClaimedPlate[]> {
  const { data, error } = await supabase
    .from('customer_plates')
    .select('id, license_plate')
    .order('created_at')

  if (error) throw error
  return (data ?? []) as ClaimedPlate[]
}

export async function removePlate(id: string): Promise<void> {
  const { error } = await supabase.from('customer_plates').delete().eq('id', id)
  if (error) throw error
}

/**
 * Vehicles this customer may see. Row-level security does the filtering —
 * only claimed plates come back, and there is no write path at all.
 */
export async function listMyVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('registered_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Vehicle[]
}

/** Claims that couldn't run at sign-up because email confirmation was pending. */
const PENDING_KEY = 'skauto:pendingClaim'

export function savePendingClaim(plate: string, phone: string): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ plate, phone }))
  } catch {
    // Non-critical: the customer can add the plate manually instead.
  }
}

export async function runPendingClaim(): Promise<void> {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return
    const { plate, phone } = JSON.parse(raw) as { plate: string; phone: string }
    const result = await claimPlate(plate, phone)
    if (result.ok) localStorage.removeItem(PENDING_KEY)
  } catch {
    // Leave it queued; the customer can also claim manually.
  }
}
