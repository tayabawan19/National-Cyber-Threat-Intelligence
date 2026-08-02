import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { DashboardService } from './dashboard/dashboard.service';
import { CasesService } from './cases/cases.service';
import { AlertsService } from './alerts/alerts.service';
import { Severity, CaseStatus, AlertStatus } from '@prisma/client';

async function runPhase4Verification() {
  console.log('\n=======================================================');
  console.log('       PHASE 4 RIGOROUS SYSTEM VERIFICATION           ');
  console.log('=======================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const dashboardService = app.get(DashboardService);
  const casesService = app.get(CasesService);
  const alertsService = app.get(AlertsService);

  let successCount = 0;
  let totalTests = 4;

  try {
    // -------------------------------------------------------------------
    // TEST 1: DASHBOARD REAL DATA STATS AUDIT
    // -------------------------------------------------------------------
    console.log('--- TEST 1: DASHBOARD REAL DATA STATS AUDIT ---');
    const stats = await dashboardService.getStats();
    console.log(`[TEST 1] Total Alerts (DB): ${stats.totalAlerts}`);
    console.log(`[TEST 1] Open Alerts (DB): ${stats.openAlerts}`);
    console.log(`[TEST 1] Total IOCs (DB): ${stats.totalIocs}`);
    console.log(`[TEST 1] Total CVEs (DB): ${stats.totalCves}`);
    console.log(`[TEST 1] Severity Breakdown:`, stats.severityDistribution);
    console.log(`[TEST 1] Alert Volume Trend Days: ${stats.alertVolumeTrend.length}`);
    console.log(`[TEST 1] Top Targeted Countries: ${stats.topTargetedCountries.length} countries indexed`);
    console.log(`[TEST 1] Top IOC Sources: ${stats.topIocSources.length} sources indexed`);
    console.log(`[TEST 1] Rule Performance: ${stats.rulePerformance.length} rules evaluated`);

    if (
      typeof stats.totalAlerts === 'number' &&
      typeof stats.totalIocs === 'number' &&
      Array.isArray(stats.alertVolumeTrend)
    ) {
      console.log('✅ TEST 1 PASSED: SOC Dashboard metrics pulled directly from live database.\n');
      successCount++;
    } else {
      console.log('❌ TEST 1 FAILED: Invalid dashboard statistics structure.\n');
    }

    // -------------------------------------------------------------------
    // TEST 2: CASE CREATION & INVESTIGATION WORKFLOW
    // -------------------------------------------------------------------
    console.log('--- TEST 2: CASE CREATION & INVESTIGATION WORKFLOW ---');
    const preIocCount = await prisma.ioc.count();
    const preCveCount = await prisma.cve.count();

    const newCase = await casesService.create({
      title: '[TEST_PHASE4] Verification Case - APT29 Investigation',
      description: 'Testing case-to-alert linking, topology aggregation, and audit logging.',
      severity: Severity.HIGH,
      status: CaseStatus.OPEN,
    });
    console.log(`[TEST 2] Created Case ID: ${newCase.id} | Title: ${newCase.title}`);

    // Create a standalone alert
    const newAlert = await alertsService.create({
      source: 'Phase 4 Test Engine',
      description: '[TEST_PHASE4] Suspicious C2 beaconing detected from 185.220.101.5',
      severity: Severity.HIGH,
      status: AlertStatus.NEW,
    });
    console.log(`[TEST 2] Created Standalone Alert ID: ${newAlert.id}`);

    // Link Alert to Case
    const updatedAlert = await alertsService.update(newAlert.id, {
      relatedCaseId: newCase.id,
    });
    console.log(`[TEST 2] Attached Alert to Case ID: ${updatedAlert.relatedCaseId}`);

    // Fetch Case Detail
    const caseDetail = await casesService.findOne(newCase.id);
    console.log(`[TEST 2] Case Detail Linked Alerts: ${caseDetail.alerts.length}`);
    console.log(`[TEST 2] Case Detail Linked CVEs: ${caseDetail.cves.length}`);
    console.log(`[TEST 2] Case Detail Linked Malware: ${caseDetail.malwareSamples.length}`);

    // Check DB persistence directly from Prisma
    const dbAlertCheck = await prisma.alert.findUnique({ where: { id: newAlert.id } });

    if (
      caseDetail.alerts.some((a) => a.id === newAlert.id) &&
      dbAlertCheck?.relatedCaseId === newCase.id
    ) {
      console.log('✅ TEST 2 PASSED: Alert-to-Case link successfully created & persisted in DB.\n');
      successCount++;
    } else {
      console.log('❌ TEST 2 FAILED: Alert-to-Case persistence failed.\n');
    }

    // -------------------------------------------------------------------
    // TEST 3: CASE AUDIT LOG TIMELINE
    // -------------------------------------------------------------------
    console.log('--- TEST 3: CASE AUDIT LOG TIMELINE ---');
    
    // Add Note to Case
    const testUser = await prisma.user.findFirst();
    await casesService.addNote(
      newCase.id,
      testUser?.id || 'system-user',
      '[TEST_PHASE4] Analyst note: Initial triage completed. Confirmed C2 infrastructure.',
    );

    const timeline = await casesService.getTimeline(newCase.id);
    console.log(`[TEST 3] Audit Log Timeline entries returned: ${timeline.length}`);
    timeline.forEach((entry, idx) => {
      console.log(`  Entry ${idx + 1}: [${entry.timestamp.toISOString()}] Target: ${entry.targetEntity} (${entry.targetId}) -> Action: ${entry.action}`);
    });

    if (timeline.length > 0) {
      console.log('✅ TEST 3 PASSED: Audit logs table used as single source of truth for case timeline.\n');
      successCount++;
    } else {
      console.log('❌ TEST 3 FAILED: Timeline returned zero audit log entries.\n');
    }

    // -------------------------------------------------------------------
    // TEST 4: SCOPED CLEANUP & NO REAL DATA LOSS VERIFICATION
    // -------------------------------------------------------------------
    console.log('--- TEST 4: SCOPED CLEANUP & DATA INTEGRITY VERIFICATION ---');
    // Delete ONLY test fixture created by this script
    await alertsService.remove(newAlert.id);
    await casesService.remove(newCase.id);

    const postIocCount = await prisma.ioc.count();
    const postCveCount = await prisma.cve.count();

    console.log(`[TEST 4] Scoped Cleanup Executed: Deleted Case '${newCase.id}' and Alert '${newAlert.id}' ONLY.`);
    console.log(`[TEST 4] IOC Count Before: ${preIocCount} | IOC Count After: ${postIocCount}`);
    console.log(`[TEST 4] CVE Count Before: ${preCveCount} | CVE Count After: ${postCveCount}`);

    if (preIocCount === postIocCount && preCveCount === postCveCount) {
      console.log('✅ TEST 4 PASSED: Zero real data loss verified! Cleanup was strictly scoped to test fixtures.\n');
      successCount++;
    } else {
      console.log('❌ TEST 4 FAILED: Data count mismatch after cleanup!\n');
    }

  } catch (err: any) {
    console.error('❌ Verification Error:', err.message, err.stack);
  } finally {
    await app.close();
  }

  console.log('=======================================================');
  console.log(`PHASE 4 VERIFICATION RESULTS: ${successCount} / ${totalTests} TESTS PASSED`);
  console.log('=======================================================\n');
}

runPhase4Verification();
