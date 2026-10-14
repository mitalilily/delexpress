import { and, eq } from 'drizzle-orm'
import { db } from '../models/client'
import { locations } from '../models/schema/locations'
import { b2bPincodes, zones } from '../models/schema/zones'

type ZoneDefinition = {
  code: string
  states?: string[]
  cities?: string[]
  description: string
}

const normalize = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[&/.-]+/g, ' ')
    .replace(/\s+/g, ' ')

const zoneDefinitions: ZoneDefinition[] = [
  {
    code: 'N1',
    cities: ['Delhi', 'New Delhi', 'Faridabad', 'Gurgaon', 'Gurugram', 'Ghaziabad', 'Noida', 'Sahibabad', 'Chandigarh', 'Jaipur'],
    description: 'Delhi NCR, Chandigarh and Jaipur metro locations',
  },
  { code: 'N2', cities: ['Dehradun', 'Ludhiana'], description: 'Dehradun and Ludhiana' },
  {
    code: 'N3',
    states: ['Haryana', 'Punjab', 'Rajasthan', 'Uttar Pradesh'],
    description: 'Haryana, Punjab, Rajasthan and Uttar Pradesh',
  },
  {
    code: 'N4',
    states: ['Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand'],
    description: 'Himachal Pradesh, Jammu and Kashmir and Uttarakhand',
  },
  { code: 'C1', cities: ['Bhopal', 'Indore', 'Raipur'], description: 'Bhopal, Indore and Raipur' },
  { code: 'C2', states: ['Chhattisgarh', 'Madhya Pradesh'], description: 'Chhattisgarh and Madhya Pradesh' },
  {
    code: 'W1',
    cities: ['Mumbai', 'Pune', 'Thane', 'Ahmedabad', 'Surat'],
    description: 'Mumbai, Pune, Thane, Ahmedabad and Surat',
  },
  {
    code: 'W2',
    states: ['Maharashtra', 'Gujarat', 'Goa', 'Dadra & Nagar Haveli', 'Daman & Diu'],
    description: 'Maharashtra, Gujarat, Goa, Dadra and Nagar Haveli, Daman and Diu',
  },
  { code: 'S1', cities: ['Bangalore', 'Bengaluru', 'Hyderabad', 'Chennai'], description: 'Bangalore, Hyderabad and Chennai' },
  { code: 'S2', states: ['Andhra Pradesh', 'Karnataka', 'Telangana'], description: 'Andhra Pradesh, Karnataka and Telangana' },
  { code: 'S3', states: ['Tamil Nadu', 'Puducherry'], description: 'Tamil Nadu and Puducherry' },
  { code: 'S4', states: ['Kerala'], description: 'Kerala' },
  {
    code: 'E1',
    cities: ['Kolkata', 'Calcutta', 'Patna', 'Ranchi', 'Bhubaneswar', 'Bhubaneshwar', 'Siliguri'],
    description: 'Kolkata, Patna, Ranchi, Bhubaneswar and Siliguri',
  },
  { code: 'E2', states: ['Bihar', 'Odisha', 'Jharkhand', 'West Bengal'], description: 'Bihar, Odisha, Jharkhand and West Bengal' },
  { code: 'NE1', cities: ['Guwahati'], description: 'Guwahati' },
  {
    code: 'NE2',
    states: ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'],
    description: 'North-east India excluding Guwahati metro',
  },
]

const stateAliases: Record<string, string[]> = {
  'jammu kashmir': ['jammu and kashmir', 'jammu kashmir', 'jammu & kashmir'],
  uttarakhand: ['uttarakhand', 'uttaranchal'],
  'dadra nagar haveli': ['dadra and nagar haveli', 'dadra nagar haveli', 'dadra & nagar haveli'],
  'daman diu': ['daman and diu', 'daman diu', 'daman & diu'],
  puducherry: ['puducherry', 'pondicherry'],
  odisha: ['odisha', 'orissa'],
}

const matchesState = (actual: string, expected: string) => {
  const actualKey = normalize(actual)
  const expectedKey = normalize(expected)
  if (actualKey === expectedKey) return true
  return (stateAliases[expectedKey] || []).some((alias) => normalize(alias) === actualKey)
}

const matchesCity = (actual: string, expected: string) => normalize(actual) === normalize(expected)

const findZone = (location: { city: string; state: string }) => {
  // City rows are deliberately evaluated first because they override their
  // broader state zone (for example Pune/W1 over Maharashtra/W2).
  const cityZone = zoneDefinitions.find((zone) =>
    zone.cities?.some((city) => matchesCity(location.city, city)),
  )
  if (cityZone) return cityZone.code

  return zoneDefinitions.find((zone) =>
    zone.states?.some((state) => matchesState(location.state, state)),
  )?.code
}

const chunks = <T>(items: T[], size: number) => {
  const output: T[][] = []
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size))
  return output
}

async function syncB2BZoneCatalogue() {
  await db.transaction(async (tx) => {
    const zoneRows = new Map<string, string>()

    for (const definition of zoneDefinitions) {
      const states = definition.states || []
      const metadata = {
        catalogue: 'b2b-image-2026-10-12',
        city_overrides: definition.cities || [],
      }
      const [existing] = await tx
        .select({ id: zones.id })
        .from(zones)
        .where(and(eq(zones.code, definition.code), eq(zones.business_type, 'B2B')))
        .limit(1)

      if (existing) {
        await tx
          .update(zones)
          .set({
            name: `${definition.code} Zone`,
            description: definition.description,
            states,
            metadata,
            updated_at: new Date(),
          })
          .where(eq(zones.id, existing.id))
        zoneRows.set(definition.code, existing.id)
      } else {
        const [created] = await tx
          .insert(zones)
          .values({
            code: definition.code,
            name: `${definition.code} Zone`,
            description: definition.description,
            business_type: 'B2B',
            states,
            metadata,
          })
          .returning({ id: zones.id })
        if (!created) throw new Error(`Failed to create B2B zone ${definition.code}`)
        zoneRows.set(definition.code, created.id)
      }
    }

    const locationRows = await tx.select().from(locations)
    const assignmentByPincode = new Map<
      string,
      { location: (typeof locationRows)[number]; zoneCode: string }
    >()
    for (const location of locationRows) {
      const zoneCode = findZone(location)
      if (zoneCode) assignmentByPincode.set(location.pincode, { location, zoneCode })
    }
    const assignments = Array.from(assignmentByPincode.values())

    const pincodeSet = new Set(assignments.map(({ location }) => location.pincode))
    const existingRows = pincodeSet.size
      ? await tx.select({ id: b2bPincodes.id, pincode: b2bPincodes.pincode }).from(b2bPincodes)
      : []
    const existingByPincode = new Map(existingRows.map((row) => [row.pincode, row.id]))

    for (const assignmentChunk of chunks(assignments, 500)) {
      for (const { location, zoneCode } of assignmentChunk) {
        const zoneId = zoneRows.get(zoneCode)
        if (!zoneId) throw new Error(`Missing B2B zone id for ${zoneCode}`)
        const existingId = existingByPincode.get(location.pincode)
        if (existingId) {
          await tx
            .update(b2bPincodes)
            .set({ zone_id: zoneId, updated_at: new Date() })
            .where(eq(b2bPincodes.id, existingId))
        } else {
          await tx.insert(b2bPincodes).values({
            pincode: location.pincode,
            city: location.city,
            state: location.state,
            zone_id: zoneId,
            courier_id: null,
            service_provider: null,
            is_oda: false,
            is_remote: false,
            is_mall: false,
            is_sez: false,
            is_airport: false,
            is_high_security: false,
            is_csd: false,
          })
          existingByPincode.set(location.pincode, 'inserted')
        }
      }
    }

    const counts = new Map<string, number>()
    for (const { zoneCode } of assignments) counts.set(zoneCode, (counts.get(zoneCode) || 0) + 1)
    console.log(`B2B zones synchronized: ${zoneDefinitions.length} zones, ${assignments.length} location rows`)
    console.log(Object.fromEntries(zoneDefinitions.map(({ code }) => [code, counts.get(code) || 0])))
  })
}

syncB2BZoneCatalogue()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to synchronize B2B zone catalogue:', error)
    process.exit(1)
  })
