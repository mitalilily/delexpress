// seedAdmin.ts
import bcrypt from 'bcryptjs'
import { eq, or, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/client'
import { users } from '../models/schema/users'
import { User } from '../models/services/userService'

interface SeedAdminProps {
  phone: string
  password: string
  email?: string
  role?: 'admin' | 'customer' | 'manager'
}

export const seedAdmin = async ({
  phone,
  password,
  email,
  role = 'admin',
}: SeedAdminProps): Promise<User> => {
  const normalizedEmail = email?.trim().toLowerCase()
  const hashedPassword = await bcrypt.hash(password, 10)
  const [existing] = await db
    .select()
    .from(users)
    .where(
      normalizedEmail
        ? or(eq(users.phone, phone), sql`lower(trim(${users.email})) = ${normalizedEmail}`)
        : eq(users.phone, phone),
    )

  if (existing) {
    const [updatedUser] = await db
      .update(users)
      .set({
        email: normalizedEmail ?? existing.email,
        phone,
        passwordHash: hashedPassword,
        role,
        phoneVerified: true,
        emailVerified: Boolean(normalizedEmail),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning()

    return updatedUser as User
  }

  const [newUser] = await db
    .insert(users)
    .values({
      id: uuidv4(),
      phone,
      email: normalizedEmail ?? null,
      passwordHash: hashedPassword,
      role,
      phoneVerified: true,
      emailVerified: !!normalizedEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return newUser as User
}

seedAdmin({
  phone: '+916283315911', // valid Indian phone format
  email: 'admin@ExpressoPro.in', // professional-looking dev email
  password: 'Admin@12345!', // strong password
  role: 'admin',
})
  .then((user) => {
    console.log('Admin user created or already exists:', user)
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error seeding admin:', err)
    process.exit(1)
  })
