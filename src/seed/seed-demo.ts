import { createClient } from '@supabase/supabase-js';
import prisma from '../utils/prisma';

const DEMO_EMAIL = 'admin@geotraizer.com';
const DEMO_PASSWORD = 'Asdf1234!';
const DEMO_COMPANY = 'PGENRO Iloilo - Demo';

async function seedDemo() {
  console.log('🌱 Seeding demo data...\n');

  // ---------------------------------------------------------------
  // Phase 1: Supabase User + Company
  // ---------------------------------------------------------------
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let userId: string;

  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const existing = existingUsers?.users?.find(
    (u) => u.email === DEMO_EMAIL
  );

  if (existing) {
    userId = existing.id;
    console.log(`  ✓ Supabase user already exists: ${DEMO_EMAIL} (${userId})`);
  } else {
    const { data: created, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Demo Admin' },
      });

    if (error) {
      console.error('❌ Failed to create Supabase user:', error.message);
      process.exit(1);
    }

    userId = created.user!.id;
    console.log(`  ✓ Supabase user created: ${DEMO_EMAIL} (verified)`);
  }

  // Upsert Company (id = Supabase user UUID)
  const company = await prisma.company.upsert({
    where: { id: userId },
    update: { companyName: DEMO_COMPANY },
    create: { id: userId, companyName: DEMO_COMPANY },
  });
  console.log(`  ✓ Company: ${company.companyName}\n`);

  // ---------------------------------------------------------------
  // Phase 2: Sample Projects
  // ---------------------------------------------------------------

  // Helper to find a barangay by name and municipality name
  const findBarangay = async (
    barangayName: string,
    municipalityName: string
  ) => {
    const b = await prisma.barangay.findFirst({
      where: {
        name: barangayName,
        municipality: { name: municipalityName },
      },
    });
    if (!b) {
      throw new Error(
        `Barangay "${barangayName}" in municipality "${municipalityName}" not found. Run "yarn db:seed" first.`
      );
    }
    return b;
  };

  // Define sample projects
  const sampleProjects = [
    {
      projectCode: 'ISF-2024-001',
      title: 'Adcadarao Mangrove Reforestation',
      status: 'ONGOING' as const,
      startDate: '2023',
      endDate: '2025',
      totalAreaDeveloped: 45.5,
      totalProjectCost: 2500000,
      description:
        'Mangrove reforestation along the coastal areas of Barangay Adcadarao. Community-led initiative to restore 45.5 hectares of degraded mangrove forests.',
      barangay: ['Adcadarao', 'Ajuy'],
      components: [
        { title: 'Mangrove Seedling Production', cost: 500000 },
        { title: 'Community Training & Capacity Building', cost: 350000 },
        { title: 'Planting & Maintenance', cost: 1200000 },
        { title: 'Monitoring & Evaluation', cost: 450000 },
      ],
    },
    {
      projectCode: 'ISF-2023-022',
      title: 'Alimodian Watershed Protection Program',
      status: 'ONGOING' as const,
      startDate: '2022',
      endDate: '2024',
      totalAreaDeveloped: 120,
      totalProjectCost: 8750000,
      description:
        'Comprehensive watershed management program covering 120 hectares in Alimodian. Includes reforestation, terracing, and water impounding structures.',
      barangay: ['Abang-abang', 'Alimodian'],
      components: [
        { title: 'Watershed Survey & Planning', cost: 1500000 },
        { title: 'Reforestation Activities', cost: 3500000 },
        { title: 'Water Impounding Structures', cost: 2500000 },
        { title: 'Community Livelihood Program', cost: 1250000 },
      ],
    },
    {
      projectCode: 'ISF-2020-015',
      title: 'Banate Coastal Resource Management',
      status: 'COMPLETED' as const,
      startDate: '2020',
      endDate: '2023',
      totalAreaDeveloped: 35,
      totalProjectCost: 1800000,
      description:
        'Completed coastal resource management project focusing on sustainable fishing practices, coral reef protection, and marine sanctuary establishment in Banate.',
      barangay: ['Bariga', 'Banate'],
      components: [
        { title: 'Marine Sanctuary Demarcation', cost: 600000 },
        { title: 'Fisherfolk Training Program', cost: 400000 },
        { title: 'Artificial Reef Deployment', cost: 800000 },
      ],
    },
    {
      projectCode: 'ISF-2024-112',
      title: 'Cabatuan Agroforestry Initiative',
      status: 'PLANNED' as const,
      startDate: '2024',
      endDate: '2026',
      totalAreaDeveloped: 75,
      totalProjectCost: 5200000,
      description:
        'Planned agroforestry project integrating fruit trees, timber species, and agricultural crops on 75 hectares of upland farms in Cabatuan.',
      barangay: ['Acao', 'Cabatuan'],
      components: [
        { title: 'Land Preparation & Survey', cost: 800000 },
        { title: 'Agroforestry Training', cost: 500000 },
        { title: 'Nursery Establishment', cost: 700000 },
        { title: 'Planting Operations', cost: 2200000 },
        { title: 'Post-Planting Care', cost: 1000000 },
      ],
    },
    {
      projectCode: 'ISF-2021-034',
      title: 'Miagao Upland Development Project',
      status: 'CANCELLED' as const,
      startDate: '2021',
      endDate: '2022',
      totalAreaDeveloped: 20,
      totalProjectCost: 900000,
      description:
        'Cancelled upland development project in Miagao. Discontinued due to land tenure issues and lack of community participation.',
      barangay: ['Agdum', 'Miagao'],
      components: [
        { title: 'Initial Site Assessment', cost: 300000 },
        { title: 'Community Consultations', cost: 200000 },
        { title: 'Seedling Procurement (partial)', cost: 400000 },
      ],
    },
    {
      projectCode: 'ISF-2024-075',
      title: 'San Joaquin Riverbank Stabilization',
      status: 'ONGOING' as const,
      startDate: '2023',
      endDate: '2025',
      totalAreaDeveloped: 15,
      totalProjectCost: 3100000,
      description:
        'Riverbank stabilization using bioengineering techniques along critical erosion-prone sections in San Joaquin. Includes bamboo planting and gabion installation.',
      barangay: ['Amboyu-an', 'San Joaquin'],
      components: [
        { title: 'Riverbank Assessment', cost: 400000 },
        { title: 'Gabion & Bioengineering Works', cost: 1800000 },
        { title: 'Bamboo & Vetiver Planting', cost: 600000 },
        { title: 'Community Monitoring', cost: 300000 },
      ],
    },
    {
      projectCode: 'ISF-2024-190',
      title: 'Oton Community-Based Forest Management',
      status: 'PLANNED' as const,
      startDate: '2024',
      endDate: '2027',
      totalAreaDeveloped: 200,
      totalProjectCost: 12000000,
      description:
        'Large-scale community-based forest management in Oton covering 200 hectares. Aims to restore degraded forestlands through participatory approach.',
      barangay: ['Abilay Norte', 'Oton'],
      components: [
        { title: 'Forest Resource Assessment', cost: 2000000 },
        { title: 'Community Organization', cost: 1500000 },
        { title: 'Nursery & Seedling Production', cost: 2000000 },
        { title: 'Large-Scale Planting', cost: 5000000 },
        { title: 'Protection & Maintenance', cost: 1500000 },
      ],
    },
    {
      projectCode: 'ISF-2019-008',
      title: 'Tigbauan Bamboo Plantation Project',
      status: 'COMPLETED' as const,
      startDate: '2019',
      endDate: '2022',
      totalAreaDeveloped: 60,
      totalProjectCost: 4500000,
      description:
        'Completed bamboo plantation establishment along the upland areas of Tigbauan. Successful in producing commercial-grade bamboo for local construction and handicraft industries.',
      barangay: ['Alupidian', 'Tigbauan'],
      components: [
        { title: 'Land Preparation', cost: 900000 },
        { title: 'Bamboo Propagation & Planting', cost: 1800000 },
        { title: 'Maintenance & Fertilization', cost: 900000 },
        { title: 'Harvesting & Marketing Training', cost: 900000 },
      ],
    },
  ];

  console.log('📋 Creating sample projects...');
  let projectCount = 0;
  for (const p of sampleProjects) {
    const [barangayName, municipalityName] = p.barangay;
    const barangay = await findBarangay(barangayName, municipalityName);

    await prisma.project.upsert({
      where: { projectCode: p.projectCode },
      update: {
        title: p.title,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        totalAreaDeveloped: p.totalAreaDeveloped,
        totalProjectCost: p.totalProjectCost,
        description: p.description,
        barangayId: barangay.id,
      },
      create: {
        projectCode: p.projectCode,
        title: p.title,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        totalAreaDeveloped: p.totalAreaDeveloped,
        totalProjectCost: p.totalProjectCost,
        description: p.description,
        companyId: company.id,
        barangayId: barangay.id,
        components: p.components
          ? {
              create: p.components.map((c) => ({
                componentTitle: c.title,
                componentCost: c.cost,
              })),
            }
          : undefined,
      },
    });
    console.log(`  ✓ ${p.title} [${p.status}]`);
    projectCount++;
  }
  console.log(`  → ${projectCount} projects created\n`);

  // ---------------------------------------------------------------
  // Phase 3: Sample Stewards
  // ---------------------------------------------------------------

  // Helper: find municipality by name
  const findMunicipality = async (name: string) => {
    const m = await prisma.municipality.findFirst({
      where: { name },
    });
    if (!m) throw new Error(`Municipality "${name}" not found.`);
    return m;
  };

  // Simple GeoJSON polygons inside Panay Island (approx coords)
  const makeGeoJson = (
    centerLng: number,
    centerLat: number,
    size: number
  ): string => {
    const d = size / 10000; // scale offset in degrees (~111km per degree)
    return JSON.stringify({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [centerLng - d, centerLat - d],
            [centerLng + d, centerLat - d],
            [centerLng + d, centerLat + d],
            [centerLng - d, centerLat + d],
            [centerLng - d, centerLat - d],
          ],
        ],
      },
    });
  };

  const sampleStewards = [
    {
      cscNumber: 'CSC-2023-001',
      name: 'Juan Dela Cruz',
      area: 12.5,
      dateIssued: '2022-01-15',
      dateExpiry: '2027-01-15',
      hasGeoJson: true,
      barangay: ['Adcadarao', 'Ajuy', 121.95, 11.17] as const, // name, muni, lng, lat
    },
    {
      cscNumber: 'CSC-2022-045',
      name: 'Maria Santos',
      area: 8.3,
      dateIssued: '2021-06-20',
      dateExpiry: '2026-06-20',
      hasGeoJson: true,
      barangay: ['Abang-abang', 'Alimodian', 122.42, 10.98] as const,
    },
    {
      cscNumber: 'CSC-2024-118',
      name: 'Pedro Reyes',
      area: 25.0,
      dateIssued: '2023-11-10',
      dateExpiry: '2028-11-10',
      hasGeoJson: true,
      barangay: ['Acao', 'Cabatuan', 122.48, 10.88] as const,
    },
    {
      cscNumber: 'CSC-2023-067',
      name: 'Ana Gonzales',
      area: 15.7,
      dateIssued: '2022-08-05',
      dateExpiry: '2027-08-05',
      hasGeoJson: false,
      barangay: ['Amboyu-an', 'San Joaquin', 122.13, 10.59] as const,
    },
    {
      cscNumber: 'CSC-2022-089',
      name: 'Roberto Lopez',
      area: 6.2,
      dateIssued: '2021-03-22',
      dateExpiry: '2026-03-22',
      hasGeoJson: false,
      barangay: ['Alupidian', 'Tigbauan', 122.34, 10.67] as const,
    },
  ];

  console.log('👨‍🌾 Creating sample stewards...');
  const stewardRecords: { id: string; name: string }[] = [];

  for (const s of sampleStewards) {
    const [barangayName, municipalityName, lng, lat] = s.barangay;
    const barangay = await findBarangay(barangayName, municipalityName);
    const municipality = await findMunicipality(municipalityName);

    const steward = await prisma.steward.upsert({
      where: { cscNumber: s.cscNumber },
      update: {
        name: s.name,
        area: s.area,
        dateIssued: new Date(s.dateIssued),
        dateExpiry: new Date(s.dateExpiry),
        barangayId: barangay.id,
        municipalityId: municipality.id,
      },
      create: {
        cscNumber: s.cscNumber,
        name: s.name,
        area: s.area,
        dateIssued: new Date(s.dateIssued),
        dateExpiry: new Date(s.dateExpiry),
        barangayId: barangay.id,
        municipalityId: municipality.id,
        geojson: s.hasGeoJson ? makeGeoJson(lng, lat, s.area) : null,
      },
    });

    stewardRecords.push({ id: steward.id, name: steward.name });
    console.log(`  ✓ ${s.name} (${s.cscNumber}, ${s.area} ha)`);
  }
  console.log(`  → ${stewardRecords.length} stewards created\n`);

  // ---------------------------------------------------------------
  // Phase 4: Sample Evaluations
  // ---------------------------------------------------------------
  console.log('⭐ Creating sample evaluations...');

  const sampleEvaluations = [
    {
      stewardIdx: 0,
      rating: 5,
      recommendation: 'Renew',
      ratingRemarks:
        'Excellent stewardship of mangrove area. Survival rate above 90%. Actively participates in community monitoring activities.',
      actionTaken:
        'Certification renewed for another 5-year term. Recommended for best steward award.',
      generalRemarks:
        'Juan consistently demonstrates strong commitment to sustainable forest management.',
    },
    {
      stewardIdx: 1,
      rating: 4,
      recommendation: 'Renew with conditions',
      ratingRemarks:
        'Good watershed management but needs improvement in record-keeping. Tree survival rate at 80%.',
      actionTaken:
        'Renewal approved with requirement to submit quarterly progress reports.',
      generalRemarks:
        'Maria shows initiative but requires additional training on documentation.',
    },
    {
      stewardIdx: 2,
      rating: 4,
      recommendation: 'Renew',
      ratingRemarks:
        'Large area well managed. Agroforestry practices are effective. Good community relations and knowledge sharing.',
      actionTaken:
        'CSC renewed. Additional 5 hectares allocated for expansion.',
      generalRemarks:
        'Pedro is a model steward, regularly sharing best practices with neighboring communities.',
    },
    {
      stewardIdx: 3,
      rating: 3,
      recommendation: 'Probationary renewal',
      ratingRemarks:
        'Adequate performance but some sections show signs of neglect. Needs closer monitoring and support.',
      actionTaken:
        'Probationary renewal for 2 years with monthly monitoring visits.',
      generalRemarks:
        'Ana needs additional technical support to improve land management outcomes.',
    },
    {
      stewardIdx: 4,
      rating: 4,
      recommendation: 'Renew',
      ratingRemarks:
        'Consistent performance on a small but well-maintained plot. High-quality bamboo production.',
      actionTaken:
        'Regular renewal approved. Technical assistance for marketing provided.',
      generalRemarks:
        'Roberto maintains an exemplary small-scale stewardship, focusing on quality over quantity.',
    },
  ];

  for (const ev of sampleEvaluations) {
    const steward = stewardRecords[ev.stewardIdx];
    const existing = await prisma.evaluation.findFirst({
      where: { stewardId: steward.id },
    });

    if (!existing) {
      await prisma.evaluation.create({
        data: {
          rating: ev.rating,
          recommendation: ev.recommendation,
          ratingRemarks: ev.ratingRemarks,
          actionTaken: ev.actionTaken,
          generalRemarks: ev.generalRemarks,
          stewardId: steward.id,
        },
      });
      console.log(`  ✓ ${steward.name}: ${ev.rating}/5 — ${ev.recommendation}`);
    } else {
      console.log(
        `  → ${steward.name}: evaluation already exists, skipping`
      );
    }
  }

  // ---------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------
  const totalProjects = await prisma.project.count({
    where: { companyId: company.id },
  });
  const totalStewards = await prisma.steward.count();
  const totalEvaluations = await prisma.evaluation.count();

  console.log(`\n✅ Demo seed complete!\n`);
  console.log('   ┌─────────────────────────────────────────┐');
  console.log(`   │  Login:     ${DEMO_EMAIL.padEnd(28)}│`);
  console.log(`   │  Password:  ${DEMO_PASSWORD.padEnd(28)}│`);
  console.log(`   │  Company:   ${DEMO_COMPANY.padEnd(28)}│`);
  console.log(`   │  Projects:  ${String(totalProjects).padEnd(28)}│`);
  console.log(`   │  Stewards:  ${String(totalStewards).padEnd(28)}│`);
  console.log(`   │  Evals:     ${String(totalEvaluations).padEnd(28)}│`);
  console.log('   └─────────────────────────────────────────┘\n');
}

seedDemo()
  .catch((error) => {
    console.error('❌ Fatal error during demo seeding:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
