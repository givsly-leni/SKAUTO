export type JobStatus = 'scheduled' | 'in_progress' | 'completed'

export interface Vehicle {
  id: string
  user_id: string
  customer_name: string
  customer_phone: string | null
  license_plate: string
  vin: string | null
  vehicle_date: string | null
  status: JobStatus
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
  vin: string
  vehicle_date: string
  status: JobStatus
  cost: string
  notes: string
  restored_parts: string[]
}

export const STATUS_ORDER: JobStatus[] = ['scheduled', 'in_progress', 'completed']

export const STATUS_META: Record<JobStatus, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: '#f59e0b' },
  in_progress: { label: 'In progress', color: '#3b82f6' },
  completed: { label: 'Completed', color: '#22c55e' },
}

export const emptyVehicleInput = (): VehicleInput => ({
  customer_name: '',
  customer_phone: '',
  license_plate: '',
  vin: '',
  vehicle_date: '',
  status: 'scheduled',
  cost: '',
  notes: '',
  restored_parts: [],
})
