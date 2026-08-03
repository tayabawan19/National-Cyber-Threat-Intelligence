import { PrismaClient, Role, RuleCorrelationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cyberintel.gov';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass123!';
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const readonlyUser = await prisma.user.upsert({
    where: { email: 'readonly@cyberintel.gov' },
    update: {
      passwordHash: await bcrypt.hash('ReadOnlyPass123!', saltRounds),
      role: Role.READ_ONLY,
    },
    create: {
      email: 'readonly@cyberintel.gov',
      passwordHash: await bcrypt.hash('ReadOnlyPass123!', saltRounds),
      role: Role.READ_ONLY,
    },
  });

  const analystUser = await prisma.user.upsert({
    where: { email: 'analyst@cyberintel.gov' },
    update: {
      passwordHash: await bcrypt.hash('AnalystPass123!', saltRounds),
      role: Role.SOC_ANALYST,
    },
    create: {
      email: 'analyst@cyberintel.gov',
      passwordHash: await bcrypt.hash('AnalystPass123!', saltRounds),
      role: Role.SOC_ANALYST,
    },
  });

  console.log(`[SEED SUCCESS] Admin user seeded: ${admin.email} (Role: ${admin.role})`);
  console.log(`[SEED SUCCESS] ReadOnly user seeded: ${readonlyUser.email} (Role: ${readonlyUser.role})`);
  console.log(`[SEED SUCCESS] Analyst user seeded: ${analystUser.email} (Role: ${analystUser.role})`);

  const initialFeeds = [
    {
      name: 'AlienVault OTX',
      type: 'REPUTATION',
      baseUrl: 'https://otx.alienvault.com/api/v1',
      enabled: true,
    },
    {
      name: 'NVD CVE',
      type: 'VULNERABILITY',
      baseUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
      enabled: true,
    },
    {
      name: 'abuse.ch',
      type: 'MALWARE_THREATS',
      baseUrl: 'https://feodotracker.abuse.ch/downloads/ipblocklist.json',
      enabled: true,
    },
    {
      name: 'abuse.ch MalwareBazaar',
      type: 'MALWARE_SAMPLES',
      baseUrl: 'https://mb-api.abuse.ch/api/v1',
      enabled: true,
    },
    {
      name: 'MISP Threat Sharing',
      type: 'THREAT_SHARING',
      baseUrl: 'http://localhost:8443',
      enabled: true,
    },
  ];

  for (const feed of initialFeeds) {
    const createdFeed = await prisma.threatFeed.upsert({
      where: { name: feed.name },
      update: { baseUrl: feed.baseUrl, type: feed.type },
      create: feed,
    });
    console.log(`[SEED SUCCESS] ThreatFeed seeded: ${createdFeed.name} (ID: ${createdFeed.id})`);
  }

  const initialRules = [
    {
      name: 'Critical Vulnerability Ingested',
      description: 'Triggers when a CVE is ingested with CVSS score >= 9.0',
      severity: 'CRITICAL' as const,
      correlationType: RuleCorrelationType.SIMPLE,
      condition: { type: 'CVSS_SCORE_GT', threshold: 9.0 },
      enabled: true,
    },
    {
      name: 'Correlated Threat Across Multiple Feeds',
      description: 'Triggers when an IOC is reported across 2 or more distinct threat feeds',
      severity: 'HIGH' as const,
      correlationType: RuleCorrelationType.CORRELATION,
      condition: { type: 'MULTI_SOURCE_IOC', minSources: 2 },
      enabled: true,
    },
    {
      name: 'High-Risk Threat Tag',
      description: 'Triggers when an IOC contains critical threat tags like botnet, ransomware, or c2',
      severity: 'HIGH' as const,
      correlationType: RuleCorrelationType.SIMPLE,
      condition: { type: 'MATCH_TAGS', tags: ['botnet', 'ransomware', 'c2', 'exploit', 'malware'] },
      enabled: true,
    },
    {
      name: 'Elevated CVSS Vulnerability',
      description: 'Triggers when a CVE is ingested with CVSS score between 7.5 and 8.9',
      severity: 'MEDIUM' as const,
      correlationType: RuleCorrelationType.SIMPLE,
      condition: { type: 'CVSS_SCORE_GT', threshold: 7.5 },
      enabled: true,
    },
    {
      name: 'Multi-Condition Botnet & Active C2',
      description: 'Triggers when an IOC has tag "botnet" AND tag "c2"',
      severity: 'CRITICAL' as const,
      correlationType: RuleCorrelationType.MULTI_CONDITION,
      condition: {
        logicalOperator: 'AND',
        conditions: [
          { type: 'MATCH_TAGS', tags: ['botnet'] },
          { type: 'MATCH_TAGS', tags: ['c2', 'feodo-tracker'] },
        ],
      },
      enabled: true,
    },
    {
      name: 'High-Frequency Threat Occurrence Threshold',
      description: 'Triggers when identical threat indicator re-appears 3+ times',
      severity: 'HIGH' as const,
      correlationType: RuleCorrelationType.THRESHOLD,
      condition: { type: 'OCCURRENCE_COUNT', minOccurrences: 3 },
      enabled: true,
    },
    {
      name: 'Malware Family Exploitation Correlation',
      description: 'Triggers when malware sample is associated with a known CVE',
      severity: 'CRITICAL' as const,
      correlationType: RuleCorrelationType.CORRELATION,
      condition: { type: 'MALWARE_CVE_LINK' },
      enabled: true,
    },
  ];

  for (const rule of initialRules) {
    const createdRule = await prisma.detectionRule.upsert({
      where: { name: rule.name },
      update: {
        description: rule.description,
        severity: rule.severity,
        correlationType: rule.correlationType,
        condition: rule.condition,
      },
      create: rule,
    });
    console.log(`[SEED SUCCESS] DetectionRule seeded: ${createdRule.name} (Type: ${createdRule.correlationType})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
