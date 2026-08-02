import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { OtxProcessorService } from './threat-feeds/processors/otx.processor';
import { NvdProcessorService } from './threat-feeds/processors/nvd.processor';
import { AbuseChProcessorService } from './threat-feeds/processors/abusech.processor';
import { MalwareProcessorService } from './threat-feeds/processors/malware.processor';

async function runAllSyncs() {
  console.log('\n=======================================================');
  console.log('       RE-RUNNING ALL THREAT FEED SYNCS FOR RE-INGESTION');
  console.log('=======================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const otxProcessor = app.get(OtxProcessorService);
  const nvdProcessor = app.get(NvdProcessorService);
  const abuseChProcessor = app.get(AbuseChProcessorService);
  const malwareProcessor = app.get(MalwareProcessorService);

  try {
    const feeds = await prisma.threatFeed.findMany();
    console.log(`Found ${feeds.length} configured threat feeds in DB.`);

    for (const feed of feeds) {
      console.log(`\n--- SYNCING FEED: ${feed.name} (${feed.type}) ---`);
      const mockJob: any = { data: { feedId: feed.id } };
      const nameLower = feed.name.toLowerCase();

      let result: any = null;
      if (nameLower.includes('alienvault') || nameLower.includes('otx')) {
        result = await otxProcessor.processOtxJob(mockJob);
      } else if (nameLower.includes('nvd') || nameLower.includes('cve')) {
        result = await nvdProcessor.processNvdJob(mockJob);
      } else if (nameLower.includes('malware') || nameLower.includes('bazaar')) {
        result = await malwareProcessor.processMalwareJob(mockJob);
      } else if (nameLower.includes('abuse')) {
        result = await abuseChProcessor.processAbuseChJob(mockJob);
      }

      if (result) {
        console.log(`[SYNC SUCCESS] Status: ${result.status} | Ingested: ${result.recordsIngested} records`);
      }
    }

    // Report actual final database counts
    console.log('\n=======================================================');
    console.log('           POST-SYNC DATABASE ROW COUNTS               ');
    console.log('=======================================================');
    const [iocCount, cveCount, malwareCount, alertCount, caseCount, auditCount] = await Promise.all([
      prisma.ioc.count(),
      prisma.cve.count(),
      prisma.malwareSample.count(),
      prisma.alert.count(),
      prisma.case.count(),
      prisma.auditLog.count(),
    ]);

    console.log(`IOC Records (iocs):              ${iocCount}`);
    console.log(`CVE Records (cves):              ${cveCount}`);
    console.log(`Malware Samples (malware_samples): ${malwareCount}`);
    console.log(`Alerts Generated (alerts):        ${alertCount}`);
    console.log(`Cases Tracked (cases):           ${caseCount}`);
    console.log(`Audit Logs (audit_logs):         ${auditCount}`);
    console.log('=======================================================\n');

  } catch (err: any) {
    console.error('Sync failed:', err.message, err.stack);
  } finally {
    await app.close();
  }
}

runAllSyncs();
