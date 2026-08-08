import { supabase } from './supabaseClient'
import type { Vehicle, VehicleInput } from './types'

/**
 * Data access layer. Every query is automatically scoped to the signed-in
 * user by the row-level-security policies on the vehicles table, so there's
 * no need to filter by user_id on reads.
 */

export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('registered_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Vehicle[]
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return (data as Vehicle) ?? null
}

function toRow(input: VehicleInput) {
  return {
    customer_name: input.customer_name.trim(),
    customer_phone: input.customer_phone.trim() || null,
    license_plate: input.license_plate.trim().toUpperCase(),
    vin: input.vin.trim().toUpperCase() || null,
    engine_number: input.engine_number.trim().toUpperCase() || null,
    odometer_km: input.odometer_km === '' ? null : Number(input.odometer_km),
    vehicle_date: input.vehicle_date || null,
    status: input.status,
    cost: input.cost === '' ? 0 : Number(input.cost),
    notes: input.notes.trim() || null,
    restored_parts: input.restored_parts,
  }
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('You are not signed in.')

  const { data, error } = await supabase
    .from('vehicles')
    .insert({ ...toRow(input), user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data as Vehicle
}

export async function updateVehicle(
  id: string,
  input: VehicleInput,
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .update(toRow(input))
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Vehicle
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw error
}

export function vehicleToInput(v: Vehicle): VehicleInput {
  return {
    customer_name: v.customer_name ?? '',
    customer_phone: v.customer_phone ?? '',
    license_plate: v.license_plate ?? '',
    vin: v.vin ?? '',
    engine_number: v.engine_number ?? '',
    odometer_km: v.odometer_km != null ? String(v.odometer_km) : '',
    vehicle_date: v.vehicle_date ?? '',
    status: v.status,
    cost: v.cost != null ? String(v.cost) : '',
    notes: v.notes ?? '',
    restored_parts: v.restored_parts ?? [],
  }
}
