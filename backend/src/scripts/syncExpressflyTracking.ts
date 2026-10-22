import dotenv from 'dotenv'
import { pollExpressflyTracking } from '../crons/expressflyTracking'

dotenv.config({ path: '.env.production' })
dotenv.config()

const main = async () => {
  const result = await pollExpressflyTracking(200, { includeTerminal: true })
  console.log(
    `ExpressFly tracking backfill complete: selected=${result.selected} fetched=${result.fetched} ` +
      `succeeded=${result.succeeded} failed=${result.failed} inserted=${result.inserted} skipped=${result.skipped}`,
  )
  process.exitCode = result.failed ? 1 : 0
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exitCode = 1
})
