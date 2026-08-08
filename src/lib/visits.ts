import { supabase } from './supabaseClient'
import type { ServiceVisit, ServiceVisitInput } from './types'

export async function listVisits(vehicleId: string): Promise<ServiceVisit[]> {
  const { data, error } = await supabase
    .from('service_visits')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('visited_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ServiceVisit[]
}

/** Visits for several vehicles at once — used by the customer view. */
export async function listVisitsForVehicles(
  vehicleIds: string[],
): Promise<Record<string, ServiceVisit[]>> {
  if (vehicleIds.length === 0) return {}

  const { data, error } = await supabase
    .from('service_visits')
    .select('*')
    .in('vehicle_id', vehicleIds)
    .order('visited_at', { ascending: false })

  if (error) throw error

  const grouped: Record<string, ServiceVisit[]> = {}
  for (const visit of (data ?? []) as ServiceVisit[]) {
    ;(grouped[visit.vehicle_id] ??= []).push(visit)
  }
  return grouped
}

export async function createVisit(
  vehicleId: string,
  input: ServiceVisitInput,
): Promise<ServiceVisit> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('You are not signed in.')

  const odometer = input.odometer_km === '' ? null : Number(input.odometer_km)

  const { data, error } = await supabase
    .from('service_visits')
    .insert({
      vehicle_id: vehicleId,
      user_id: userId,
      visited_at: input.visited_at || new Date().toISOString().slice(0, 10),
      odometer_km: odometer,
      cost: input.cost === '' ? 0 : Number(input.cost),
      restored_parts: input.restored_parts,
      notes: input.notes.trim() || null,
    })
    .select()
    .single()

  if (error) throw error

  // Keep the vehicle's headline mileage current, but never wind it backwards.
  if (odometer != null) {
    const { data: current } = await supabase
      .from('vehicles')
      .select('odometer_km')
      .eq('id', vehicleId)
      .maybeSingle()

    const existing = (current as { odometer_km: number | null } | null)?.odometer_km
    if (existing == null || odometer > existing) {
      await supabase
        .from('vehicles')
        .update({ odometer_km: odometer })
        .eq('id', vehicleId)
    }
  }

  return data as ServiceVisit
}

export async function deleteVisit(id: string): Promise<void> {
  const { error } = await supabase.from('service_visits').delete().eq('id', id)
  if (error) throw error
}
