import { Response } from 'express'
import { adminGlobalSearch } from '../models/services/adminGlobalSearch.service'

export const adminGlobalSearchController = async (req: any, res: Response) => {
  try {
    const query = String(req.query.q || '').trim()
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 30)
    if (query.length < 2) return res.json({ success: true, results: [], query, count: 0 })
    const results = await adminGlobalSearch(query, limit)
    return res.json({ success: true, results, query, count: results.length })
  } catch (error: any) {
    console.error('Admin global search failed:', error?.message || error)
    return res.status(500).json({ success: false, message: 'Failed to perform search', results: [] })
  }
}
