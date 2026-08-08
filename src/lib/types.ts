export type JobStatus = 'scheduled' | 'in_progress' | 'completed'

export interface Vehicle {
  id: string
  user_id: string
  customer_name: string
  customer_phone: string | null
  license_plate: string
  make: string | null
  model: string | null
  vin: string | null
  engine_number: string | null
  odometer_km: number | null
  vehicle_year: number | null
  status: JobStatus
  scheduled_at: string | null
  cost: number
  notes: string | null
  restored_parts: string[]
  registered_at: string
  updated_at: string
}

/** Fields the user actually fills in — the rest are set by the database. */
export interface VehicleInput {
  customer_name: string
  customer_phone: string
  license_plate: string
  make: string
  model: string
  vin: string
  engine_number: string
  odometer_km: string
  vehicle_year: string
  status: JobStatus
  scheduled_at: string
  cost: string
  notes: string
  restored_parts: string[]
}

export const STATUS_ORDER: JobStatus[] = ['scheduled', 'in_progress', 'completed']

export const STATUS_META: Record<JobStatus, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: '#facc15' },
  in_progress: { label: 'In progress', color: '#60a5fa' },
  completed: { label: 'Completed', color: '#4ade80' },
}

export const emptyVehicleInput = (): VehicleInput => ({
  customer_name: '',
  customer_phone: '',
  license_plate: '',
  make: '',
  model: '',
  vin: '',
  engine_number: '',
  odometer_km: '',
  vehicle_year: '',
  status: 'scheduled',
  scheduled_at: '',
  cost: '',
  notes: '',
  restored_parts: [],
})

/** One workshop visit for a vehicle. The vehicle record holds the current
 *  state; visits are the permanent log of everything done over time. */
export interface ServiceVisit {
  id: string
  vehicle_id: string
  user_id: string
  visited_at: string
  odometer_km: number | null
  cost: number
  restored_parts: string[]
  notes: string | null
  created_at: string
}

export interface ServiceVisitInput {
  visited_at: string
  odometer_km: string
  cost: string
  restored_parts: string[]
  notes: string
}

export const emptyVisitInput = (): ServiceVisitInput => ({
  // Defaults to today — a visit is normally logged as it happens.
  visited_at: new Date().toISOString().slice(0, 10),
  odometer_km: '',
  cost: '',
  restored_parts: [],
  notes: '',
})
