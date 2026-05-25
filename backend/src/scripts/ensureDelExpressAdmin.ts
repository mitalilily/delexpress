import bcrypt from 'bcryptjs'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db, pool } from '../models/client'
import { users } from '../models/schema/users'

const ADMIN_EMAIL = 'admin@expressopro.in'
const ADMIN_PASSWORD = 'Admin@12345!'

async function ensureExpressoProAdmin() {
  const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase()
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const [existing] = await db
    .select()
    .from(users)
    .where(sql`lower(trim(${users.email})) = ${normalizedEmail}`)

  if (existing) {
    await db
      .update(users)
      .set({
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))

    console.log(`Updated admin credentials for ${ADMIN_EMAIL}`)
  } else {
    await db.insert(users).values({
      id: uuidv4(),
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
      emailVerified: true,
      phoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log(`Created admin user ${ADMIN_EMAIL}`)
  }

  console.log(`Admin login: ${normalizedEmail} / ${ADMIN_PASSWORD}`)
}

ensureExpressoProAdmin()
  .catch((error) => {
    console.error('Failed to ensure ExpressoPro admin:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
