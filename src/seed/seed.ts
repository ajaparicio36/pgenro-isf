import { readFileSync } from 'fs';
import { join } from 'path';
import prisma from '../utils/prisma';

interface BarangayData {
  municipality_code: number;
  municipality_name: string;
  barangay_code: number;
  barangay_name: string;
}

interface MunicipalityData {
  code: number;
  name: string;
  barangays: BarangayData[];
}

interface JsonResponse {
  result: MunicipalityData[];
}

async function seedMunicipalitiesAndBarangays() {
  try {
    console.log('🌱 Starting to seed municipalities and barangays...');

    // Read the JSON file
    const filePath = join(
      process.cwd(),
      'public',
      'filtered_municipalities.json'
    );
    const jsonData = readFileSync(filePath, 'utf-8');
    const jsonArray: JsonResponse[] = JSON.parse(jsonData);
    const municipalitiesData: MunicipalityData[] = jsonArray[0].result;

    console.log(`📊 Found ${municipalitiesData.length} municipalities to seed`);

    for (const municipalityData of municipalitiesData) {
      console.log(`🏢 Creating municipality: ${municipalityData.name}`);

      // Create municipality
      const municipality = await prisma.municipality.upsert({
        where: {
          code: municipalityData.code.toString(),
        },
        update: {
          name: municipalityData.name,
        },
        create: {
          name: municipalityData.name,
          code: municipalityData.code.toString(),
        },
      });

      console.log(
        `🏘️  Creating ${municipalityData.barangays.length} barangays for ${municipalityData.name}`
      );

      // Create barangays
      for (const barangayData of municipalityData.barangays) {
        await prisma.barangay.upsert({
          where: {
            name_municipalityId: {
              name: barangayData.barangay_name,
              municipalityId: municipality.id,
            },
          },
          update: {
            officialCode: barangayData.barangay_code.toString(),
          },
          create: {
            name: barangayData.barangay_name,
            municipalityId: municipality.id,
            officialCode: barangayData.barangay_code.toString(),
          },
        });
      }
    }

    console.log('✅ Successfully seeded all municipalities and barangays!');

    // Log summary
    const totalMunicipalities = await prisma.municipality.count();
    const totalBarangays = await prisma.barangay.count();
    console.log(
      `📈 Summary: ${totalMunicipalities} municipalities, ${totalBarangays} barangays`
    );
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedMunicipalitiesAndBarangays().catch((error) => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});
