import { and, count, eq, ilike } from 'drizzle-orm'
import axios from 'axios'
import { db } from '../client'
import { locations } from '../schema/locations'

const normalizePincode = (value: unknown) => String(value || '').replace(/\D/g, '').slice(0, 6)

const normalizeLocationRow = (row: { pincode: string; city: string; state: string; country?: string | null }) => ({
  pincode: row.pincode,
  city: row.city,
  state: row.state,
  country: row.country || 'India',
})

export const LocationService = {
  lookupPincode: async (pincodeInput: string) => {
    const pincode = normalizePincode(pincodeInput)
    if (pincode.length !== 6) {
      throw new Error('Pincode must be exactly 6 digits')
    }

    const [savedLocation] = await db
      .select()
      .from(locations)
      .where(eq(locations.pincode, pincode))
      .limit(1)

    if (savedLocation) {
      return { ...normalizeLocationRow(savedLocation), source: 'local' }
    }

    const { data } = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`, {
      timeout: 10000,
    })
    const postOffice = data?.[0]?.PostOffice?.[0]
    const status = data?.[0]?.Status

    if (status !== 'Success' || !postOffice) {
      return null
    }

    return {
      pincode,
      city: String(postOffice.District || postOffice.Name || '').trim(),
      state: String(postOffice.State || '').trim(),
      country: String(postOffice.Country || 'India').trim() || 'India',
      source: 'postal_api',
    }
  },

  create: async (data: { pincode: string; city: string; state: string; country?: string }) => {
    // Check if a location with the same pincode and city already exists
    const existing = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.pincode, data.pincode),
          eq(locations.city, data.city),
          eq(locations.state, data.state),
          eq(locations.country, data?.country ?? 'India'),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(`Location with pincode ${data.pincode} and city ${data.city} already exists`)
    }

    // Insert new location
    const [location] = await db
      .insert(locations)
      .values({
        ...data,
        country: data.country || 'India',
      })
      .returning()

    return location
  },

  list: async (params: {
    page?: number
    limit?: number
    filters?: { pincode?: string; city?: string; state?: string }
  }) => {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const offset = (page - 1) * limit

    const conditions = []
    if (params.filters) {
      const { pincode, city, state } = params.filters
      if (pincode) conditions.push(ilike(locations.pincode, `%${pincode}%`))
      if (city) conditions.push(ilike(locations.city, `%${city}%`))
      if (state) conditions.push(ilike(locations.state, `%${state}%`))
    }

    const data = await db
      .select()
      .from(locations)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)

    const totalRes = await db.select({ count: count() }).from(locations)

    const total = Number(totalRes[0]?.count ?? 0)
    return { data, total, page, limit }
  },

  getById: async (id: string) => {
    const [location] = await db.select().from(locations).where(eq(locations.id, id))
    return location
  },

  update: async (
    id: string,
    data: { pincode?: string; city?: string; state?: string; country?: string },
  ) => {
    const updated = await db.update(locations).set(data).where(eq(locations.id, id)).returning()
    return updated[0]
  },

  delete: async (id: string) => {
    const deleted = await db.delete(locations).where(eq(locations.id, id)).returning()
    return deleted[0]
  },
}
