import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function updateSeriesPath() {
  try {
    console.log('🔄 Updating series Dropbox path...\n');

    // Find the motivational quotes series
    const series = await prisma.postSeries.findFirst({
      where: {
        name: {
          contains: 'MOTIVATIONAL',
          mode: 'insensitive'
        }
      }
    });

    if (!series) {
      console.log('❌ Series not found');
      return;
    }

    console.log('📋 Current Series Configuration:');
    console.log(`   Name: ${series.name}`);
    console.log(`   Old Path: ${series.dropboxFolderPath}`);
    console.log(`   Old Folder ID: ${series.dropboxFolderId}\n`);

    // Update to new path
    const newPath = '/motivational quotes';
    
    const updated = await prisma.postSeries.update({
      where: { id: series.id },
      data: {
        dropboxFolderPath: newPath,
        dropboxFolderId: null  // Will be auto-resolved from path
      }
    });

    console.log('✅ Series Updated!');
    console.log(`   New Path: ${updated.dropboxFolderPath}`);
    console.log(`   App Folder: /Apps/BasketballFactoryPoster${updated.dropboxFolderPath}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSeriesPath();
