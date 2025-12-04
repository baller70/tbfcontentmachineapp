import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env in current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkSeriesPrompts() {
  try {
    const series = await prisma.postSeries.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        prompt: true,
        dropboxFolderPath: true,
        profile: {
          select: { name: true }
        }
      }
    });
    
    console.log('\n' + '='.repeat(100));
    console.log('ACTIVE SERIES PROMPTS');
    console.log('='.repeat(100));
    
    for (const s of series) {
      console.log('\n' + '-'.repeat(100));
      console.log('📊 Series Name:', s.name);
      console.log('👤 Profile:', s.profile?.name || 'No profile');
      console.log('📁 Dropbox Path:', s.dropboxFolderPath);
      console.log('\n📝 PROMPT:');
      console.log(s.prompt || '(No prompt configured)');
      console.log('-'.repeat(100));
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkSeriesPrompts();
