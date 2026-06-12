const { PrismaClient } = require('@prisma/client');

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'ca-central-1',
  'ap-southeast-2',
  'sa-east-1',
];

const password = 'Smartcanteen%40123';
const projectId = 'esqncwrynohhmnhepgzw';

async function testRegions() {
  for (const region of regions) {
    const url = `postgresql://postgres.${projectId}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
    console.log(`Testing region: ${region} ...`);
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: url,
        },
      },
    });

    try {
      // Attempt to connect and run a simple query
      await prisma.$connect();
      const count = await prisma.user.count();
      console.log(`\n\nSUCCESS! Found the correct region: ${region}`);
      console.log(`URL: ${url}`);
      await prisma.$disconnect();
      return url;
    } catch (err) {
      // If the error is about credentials, then it means we hit the wrong region's pooler.
      // Poolers reject connections if the project ID doesn't exist in that region.
      // We ignore and try next.
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }
  console.log('Failed to find region. Maybe the project ID or password is wrong, or region is unlisted.');
}

testRegions();
