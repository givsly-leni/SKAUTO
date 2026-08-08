/**
 * Vehicle reference data from the NHTSA vPIC database.
 *
 * https://vpic.nhtsa.dot.gov/api/ — public, free, no API key, no rate limit,
 * and CORS-enabled so the browser can call it directly.
 *
 * Caveat worth knowing: vPIC is a US regulator's database. Mainstream European
 * makes are all present (BMW, Mercedes-Benz, Audi, VW, Opel, Peugeot, Renault,
 * Fiat…), but a model sold only outside the US may be missing. Every field
 * that uses this data therefore accepts free text as well, so nothing is ever
 * blocked by a gap in the database.
 */

const BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles'
const CACHE_PREFIX = 'skauto:vpic:'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

interface Cached<T> {
  at: number
  data: T
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached<T>
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ at: Date.now(), data } satisfies Cached<T>),
    )
  } catch {
    // Storage full or blocked — caching is an optimisation, not a requirement.
  }
}

/** vPIC returns SHOUTED names; render them a bit more kindly. */
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bBmw\b/i, 'BMW')
    .replace(/\bGmc\b/i, 'GMC')
    .replace(/\bByd\b/i, 'BYD')
    .replace(/\bSsc\b/i, 'SSC')
    .replace(/\bRuf\b/i, 'RUF')
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Vehicle database returned ${res.status}`)
  return (await res.json()) as T
}

interface MakesResponse {
  Results: { MakeName: string }[]
}

/**
 * Makes across the vehicle types a workshop actually sees. Each type is a
 * separate request, so allSettled keeps a single failure from losing the rest.
 */
export async function fetchMakes(signal?: AbortSignal): Promise<string[]> {
  const cached = readCache<string[]>('makes')
  if (cached) return cached

  const types = ['car', 'truck', 'mpv']
  const settled = await Promise.allSettled(
    types.map((t) =>
      getJson<MakesResponse>(
        `${BASE}/GetMakesForVehicleType/${t}?format=json`,
        signal,
      ),
    ),
  )

  const names = new Set<string>()
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue
    for (const row of r.value.Results ?? []) {
      if (row.MakeName) names.add(titleCase(row.MakeName.trim()))
    }
  }

  if (names.size === 0) throw new Error('Could not load the make list')

  const makes = [...names].sort((a, b) => a.localeCompare(b))
  writeCache('makes', makes)
  return makes
}

interface ModelsResponse {
  Results: { Model_Name: string }[]
}

export async function fetchModels(
  make: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const key = `models:${make.toLowerCase()}`
  const cached = readCache<string[]>(key)
  if (cached) return cached

  const data = await getJson<ModelsResponse>(
    `${BASE}/GetModelsForMake/${encodeURIComponent(make)}?format=json`,
    signal,
  )

  const models = [
    ...new Set(
      (data.Results ?? [])
        .map((r) => (r.Model_Name ?? '').trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  writeCache(key, models)
  return models
}

/**
 * Model years to offer. vPIC has no "list all years" endpoint — years are a
 * plain range — so this is generated rather than fetched. Newest first, since
 * that's what a workshop reaches for most.
 */
export function listModelYears(earliest = 1950): string[] {
  const newest = new Date().getFullYear() + 1
  const years: string[] = []
  for (let y = newest; y >= earliest; y--) years.push(String(y))
  return years
}

/**
 * Models for a make in a specific year. Much tighter than the full catalogue —
 * BMW returns 63 models for 1999 versus 258 overall — which matters because
 * the unfiltered list mixes cars and motorcycles together.
 */
export async function fetchModelsForMakeYear(
  make: string,
  year: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const key = `models:${make.toLowerCase()}:${year}`
  const cached = readCache<string[]>(key)
  if (cached) return cached

  const data = await getJson<ModelsResponse>(
    `${BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${encodeURIComponent(year)}?format=json`,
    signal,
  )

  const models = [
    ...new Set(
      (data.Results ?? []).map((r) => (r.Model_Name ?? '').trim()).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  writeCache(key, models)
  return models
}

export interface VinDetails {
  make: string
  model: string
  year: string
  /** Engine family/type code, e.g. J30A4 — not the serial stamped on the block. */
  engineCode: string
  bodyClass: string
  engine: string
  fuel: string
  plant: string
}

interface DecodeResponse {
  Results: Record<string, string>[]
}

/**
 * Decode a 17-character VIN into make / model / year and a few useful extras.
 * Returns null when the database has nothing usable for that VIN.
 */
export async function decodeVin(
  vin: string,
  signal?: AbortSignal,
): Promise<VinDetails | null> {
  const clean = vin.trim().toUpperCase()
  if (clean.length < 11) throw new Error('A VIN needs at least 11 characters')

  const key = `vin:${clean}`
  const cached = readCache<VinDetails | null>(key)
  if (cached !== null) return cached

  const data = await getJson<DecodeResponse>(
    `${BASE}/DecodeVinValuesExtended/${encodeURIComponent(clean)}?format=json`,
    signal,
  )

  const r = data.Results?.[0]
  if (!r) return null

  const displacement = r.DisplacementL ? `${Number(r.DisplacementL).toFixed(1)}L` : ''
  const cylinders = r.EngineCylinders ? `${r.EngineCylinders}cyl` : ''

  const details: VinDetails = {
    make: r.Make ? titleCase(r.Make) : '',
    model: r.Model ?? '',
    year: r.ModelYear ?? '',
    engineCode: r.EngineModel ?? '',
    bodyClass: r.BodyClass ?? '',
    engine: [displacement, cylinders].filter(Boolean).join(' '),
    fuel: r.FuelTypePrimary ?? '',
    plant: [r.PlantCity, r.PlantCountry].filter(Boolean).join(', '),
  }

  if (!details.make && !details.model && !details.year) return null

  writeCache(key, details)
  return details
}
