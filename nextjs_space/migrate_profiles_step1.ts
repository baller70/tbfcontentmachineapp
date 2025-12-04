
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function step1CreateProfileTable() {
  try {
    console.log('Step 1: Creating Profile table...')
    
    // Create Profile table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Profile" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `
    
    console.log('Creating unique constraint...')
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "Profile_userId_name_key" ON "Profile"("userId", "name")
    `
    
    console.log('✓ Profile table created successfully!')
    
  } catch (error) {
    console.error('Step 1 failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

step1CreateProfileTable()
