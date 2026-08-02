import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { DetectionEngineService } from './detection-engine/detection-engine.service';
import { MalwareProcessorService } from './threat-feeds/processors/malware.processor';
import { MalwareService } from './malware/malware.service';
import { AlertsService } from './alerts/alerts.service';
import { RuleCorrelationType, Severity } from '@prisma/client';

async function runVerification() {
  console.log('\n=======================================================');
  console.log('       PHASE 3 RIGOROUS SYSTEM VERIFICATION           ');
  console.log('=======================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const detectionEngine = app.get(DetectionEngineService);
  const malwareProcessor = app.get(MalwareProcessorService);
  const malwareService = app.get(MalwareService);
  const alertsService = app.get(AlertsService);

  // -------------------------------------------------------------------
  // TEST 1: MALWARE DATABASE INGESTION & PATH TAGGING
  // -------------------------------------------------------------------
  console.log('--- TEST 1: MALWARE DATABASE INGESTION & PATH TAGGING ---');
  
  // Ensure a threat feed record exists
  let malwareFeed = await prisma.threatFeed.findFirst({ where: { name: 'abuse.ch MalwareBazaar' } });
  if (!malwareFeed) {
    malwareFeed = await prisma.threatFeed.create({
      data: {
        name: 'abuse.ch MalwareBazaar',
        type: 'MALWARE_SAMPLES',
        baseUrl: 'https://mb-api.abuse.ch/api/v1',
        enabled: true,
      },
    });
  }

  const mockJob: any = { data: { feedId: malwareFeed.id } };
  const syncResult = await malwareProcessor.processMalwareJob(mockJob);
  
  console.log(`[VERIFICATION 1] Ingestion Status Path Tag: ${syncResult.status}`);
  console.log(`[VERIFICATION 1] HTTP Status Code: ${syncResult.httpStatus}`);
  console.log(`[VERIFICATION 1] Records Ingested: ${syncResult.recordsIngested}`);
  
  const syncLog = await prisma.feedSyncLog.findFirst({
    where: { feedId: malwareFeed.id },
    orderBy: { startedAt: 'desc' },
  });
  console.log(`[VERIFICATION 1] FeedSyncLog ID: ${syncLog?.id} | Status Tag: ${syncLog?.status}`);

  const malwareSamples = await prisma.malwareSample.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  console.log(`[VERIFICATION 1] Database contains ${malwareSamples.length} recent MalwareSample records.`);
  if (malwareSamples.length > 0) {
    console.log(`[VERIFICATION 1] Sample SHA256: ${malwareSamples[0].hashSha256} | Name: ${malwareSamples[0].name} | Family: ${malwareSamples[0].malwareFamily || 'N/A'}`);
  }

  // -------------------------------------------------------------------
  // TEST 2: MALWARE OPENSEARCH MIRROR SEARCH
  // -------------------------------------------------------------------
  console.log('\n--- TEST 2: MALWARE OPENSEARCH / DATABASE SEARCH ---');
  const searchQuery = malwareSamples[0]?.name || 'exe';
  const searchResults: any = await malwareService.search(searchQuery, 1, 10);
  const items = Array.isArray(searchResults) ? searchResults : searchResults.items || searchResults.data || [];
  console.log(`[VERIFICATION 2] Search query '${searchQuery}' returned ${items.length} records.`);

  // -------------------------------------------------------------------
  // TEST 3: DETECTION ENGINE — MULTI-CONDITION & THRESHOLD & CORRELATION RULES
  // -------------------------------------------------------------------
  console.log('\n--- TEST 3: DETECTION ENGINE RULE EVALUATION ---');
  
  // Seed/ensure a Multi-Condition Rule
  const multiRule = await prisma.detectionRule.upsert({
    where: { name: 'Verify Multi-Condition Rule (Botnet AND MalwareBazaar)' },
    update: {},
    create: {
      name: 'Verify Multi-Condition Rule (Botnet AND MalwareBazaar)',
      description: 'Triggers when IOC or Malware matches botnet AND malwarebazaar tags',
      severity: Severity.HIGH,
      correlationType: RuleCorrelationType.MULTI_CONDITION,
      condition: {
        logicalOperator: 'AND',
        conditions: [
          { type: 'MATCH_TAGS', tags: ['botnet', 'malwarebazaar', 'trojan'] },
          { type: 'MATCH_TAGS', tags: ['botnet', 'malwarebazaar', 'exe'] },
        ],
      },
      enabled: true,
    },
  });

  // Seed an IOC for Multi-Condition testing
  const testIoc = await prisma.ioc.upsert({
    where: { value: '198.51.100.99' },
    update: { tags: ['botnet', 'malwarebazaar', 'c2'] },
    create: {
      type: 'IP',
      value: '198.51.100.99',
      source: 'Verification Suite',
      tags: ['botnet', 'malwarebazaar', 'c2'],
    },
  });

  await detectionEngine.evaluateIoc(testIoc.id);

  const firedAlertMulti = await prisma.alert.findFirst({
    where: { sourceIocId: testIoc.id, ruleId: multiRule.id },
  });
  console.log(`[VERIFICATION 3] Multi-Condition Rule Triggered Alert ID: ${firedAlertMulti?.id || 'None'} | Severity: ${firedAlertMulti?.severity}`);

  // -------------------------------------------------------------------
  // TEST 4: ALERT DEDUPLICATION
  // -------------------------------------------------------------------
  console.log('\n--- TEST 4: ALERT DEDUPLICATION ---');
  
  const initialAlertCount = await prisma.alert.count({
    where: { sourceIocId: testIoc.id, ruleId: multiRule.id },
  });
  const initialOccurrence = firedAlertMulti?.occurrenceCount || 1;

  console.log(`[VERIFICATION 4] Initial Alert Count in DB: ${initialAlertCount} | Occurrence Count: ${initialOccurrence}`);
  console.log(`[VERIFICATION 4] Re-triggering rule evaluation for exact same IOC (${testIoc.value})...`);

  // Evaluate same IOC second time
  await detectionEngine.evaluateIoc(testIoc.id);

  const alertCountAfter = await prisma.alert.count({
    where: { sourceIocId: testIoc.id, ruleId: multiRule.id },
  });
  const updatedAlert = await prisma.alert.findFirst({
    where: { sourceIocId: testIoc.id, ruleId: multiRule.id },
  });

  console.log(`[VERIFICATION 4] Alert Count in DB after re-trigger: ${alertCountAfter} (MUST BE 1)`);
  console.log(`[VERIFICATION 4] Updated Occurrence Count: ${updatedAlert?.occurrenceCount} (MUST BE INCREMENTED)`);
  console.log(`[VERIFICATION 4] Deduplication Success: ${alertCountAfter === 1 && updatedAlert?.occurrenceCount === initialOccurrence + 1 ? 'YES ✅' : 'NO ❌'}`);

  // -------------------------------------------------------------------
  // TEST 5: CVE <-> IOC <-> MALWARE RELATIONAL CORRELATION
  // -------------------------------------------------------------------
  console.log('\n--- TEST 5: CVE <-> IOC <-> MALWARE CORRELATION ---');
  
  // Seed a CVE and link it with Malware
  const testCve = await prisma.cve.upsert({
    where: { cveId: 'CVE-2026-99999' },
    update: { cvssScore: 9.8 },
    create: {
      cveId: 'CVE-2026-99999',
      description: 'Critical Zero-Day Remote Code Execution Vulnerability for Verification',
      cvssScore: 9.8,
      source: 'NVD Verification',
    },
  });

  const testMalware = await prisma.malwareSample.upsert({
    where: { hashSha256: 'ff11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff' },
    update: { relatedCveIds: [testCve.cveId], relatedIocId: testIoc.id },
    create: {
      name: 'Trojan.CorrelatedPayload.exe',
      malwareFamily: 'VerificationFamily',
      hashSha256: 'ff11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      source: 'Verification Suite',
      relatedCveIds: [testCve.cveId],
      relatedIocId: testIoc.id,
      tags: ['verification', 'cve-correlated'],
    },
  });

  // Evaluate malware
  await detectionEngine.evaluateMalware(testMalware.id);

  const malwareAlert = await prisma.alert.findFirst({
    where: { sourceMalwareId: testMalware.id },
    orderBy: { createdAt: 'desc' },
  });

  if (malwareAlert) {
    const enrichedAlert: any = await alertsService.findOne(malwareAlert.id);
    console.log(`[VERIFICATION 5] Alert #${enrichedAlert.id} detail API payload structure:`);
    console.log(` - Source Malware: ${enrichedAlert.sourceMalware?.name}`);
    console.log(` - Source IOC: ${enrichedAlert.sourceIoc?.value || 'N/A'}`);
    console.log(` - Cross-Referenced Related CVEs Count: ${enrichedAlert.relatedCves?.length}`);
    if (enrichedAlert.relatedCves?.length > 0) {
      console.log(`   -> CVE ID: ${enrichedAlert.relatedCves[0].cveId} (CVSS: ${enrichedAlert.relatedCves[0].cvssScore})`);
    }
  }

  // -------------------------------------------------------------------
  // TEST 6: LLM ADVISORY SEVERITY SCORING
  // -------------------------------------------------------------------
  console.log('\n--- TEST 6: LLM ADVISORY SEVERITY SCORING ---');
  if (malwareAlert) {
    console.log(`[VERIFICATION 6] Authoritative Severity: ${malwareAlert.severity}`);
    console.log(`[VERIFICATION 6] LLM Suggested Advisory Severity: ${malwareAlert.llmSuggestedSeverity || 'LOW (Fallback Scorer)'}`);
    console.log(`[VERIFICATION 6] LLM Summary text length: ${(malwareAlert.llmExplanation || '').length} characters.`);
  }

  console.log('\n=======================================================');
  console.log('       ALL PHASE 3 VERIFICATIONS COMPLETE             ');
  console.log('=======================================================\n');

  await app.close();
}

runVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
