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

  const initialAttackTechniques = [
    {
      id: 'T1071',
      techniqueId: 'T1071',
      name: 'Application Layer Protocol',
      tactic: 'Command and Control',
      description: 'Adversaries may communicate using application layer protocols to avoid detection/filtering by blending in with normal network traffic.',
      url: 'https://attack.mitre.org/techniques/T1071/',
    },
    {
      id: 'T1055',
      techniqueId: 'T1055',
      name: 'Process Injection',
      tactic: 'Defense Evasion',
      description: 'Adversaries may inject code into processes to evade process-based defenses and elevate privileges.',
      url: 'https://attack.mitre.org/techniques/T1055/',
    },
    {
      id: 'T1059',
      techniqueId: 'T1059',
      name: 'Command and Scripting Interpreter',
      tactic: 'Execution',
      description: 'Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.',
      url: 'https://attack.mitre.org/techniques/T1059/',
    },
    {
      id: 'T1190',
      techniqueId: 'T1190',
      name: 'Exploit Public-Facing Application',
      tactic: 'Initial Access',
      description: 'Adversaries may attempt to exploit a weakness in an Internet-facing computer or program to gain access.',
      url: 'https://attack.mitre.org/techniques/T1190/',
    },
    {
      id: 'T1566',
      techniqueId: 'T1566',
      name: 'Phishing',
      tactic: 'Initial Access',
      description: 'Adversaries may send phishing messages to gain access to victim systems via social engineering.',
      url: 'https://attack.mitre.org/techniques/T1566/',
    },
    {
      id: 'T1078',
      techniqueId: 'T1078',
      name: 'Valid Accounts',
      tactic: 'Persistence',
      description: 'Adversaries may obtain and abuse credentials of existing accounts to maintain access and bypass controls.',
      url: 'https://attack.mitre.org/techniques/T1078/',
    },
    {
      id: 'T1003',
      techniqueId: 'T1003',
      name: 'OS Credential Dumping',
      tactic: 'Credential Access',
      description: 'Adversaries may attempt to dump credentials to obtain account login and credential material.',
      url: 'https://attack.mitre.org/techniques/T1003/',
    },
    {
      id: 'T1021',
      techniqueId: 'T1021',
      name: 'Remote Services',
      tactic: 'Lateral Movement',
      description: 'Adversaries may use valid credentials to log into a service specifically designed to accept remote connections.',
      url: 'https://attack.mitre.org/techniques/T1021/',
    },
    {
      id: 'T1046',
      techniqueId: 'T1046',
      name: 'Network Service Discovery',
      tactic: 'Discovery',
      description: 'Adversaries may attempt to get a listing of services running on remote hosts to identify target targets.',
      url: 'https://attack.mitre.org/techniques/T1046/',
    },
    {
      id: 'T1486',
      techniqueId: 'T1486',
      name: 'Data Encrypted for Impact',
      tactic: 'Impact',
      description: 'Adversaries may encrypt data on target systems to interrupt availability of system and network resources.',
      url: 'https://attack.mitre.org/techniques/T1486/',
    },
    {
      id: 'T1105',
      techniqueId: 'T1105',
      name: 'Ingress Tool Transfer',
      tactic: 'Command and Control',
      description: 'Adversaries may transfer tools or other files from an external system into an compromised environment.',
      url: 'https://attack.mitre.org/techniques/T1105/',
    },
    {
      id: 'T1070',
      techniqueId: 'T1070',
      name: 'Indicator Removal',
      tactic: 'Defense Evasion',
      description: 'Adversaries may delete or modify artifacts generated on target systems to hinder forensic analysis.',
      url: 'https://attack.mitre.org/techniques/T1070/',
    },
    {
      id: 'T1562',
      techniqueId: 'T1562',
      name: 'Impair Defenses',
      tactic: 'Defense Evasion',
      description: 'Adversaries may maliciously modify, disable, or impair security tools and event logging mechanisms.',
      url: 'https://attack.mitre.org/techniques/T1562/',
    },
    {
      id: 'T1053',
      techniqueId: 'T1053',
      name: 'Scheduled Task/Job',
      tactic: 'Persistence',
      description: 'Adversaries may abuse task scheduling functionality to execute malicious code on a repeated or timed basis.',
      url: 'https://attack.mitre.org/techniques/T1053/',
    },
    {
      id: 'T1056',
      techniqueId: 'T1056',
      name: 'Input Capture',
      tactic: 'Collection',
      description: 'Adversaries may capture user input like keylogging or credential prompts to collect credentials.',
      url: 'https://attack.mitre.org/techniques/T1056/',
    },
    {
      id: 'T1041',
      techniqueId: 'T1041',
      name: 'Exfiltration Over C2 Channel',
      tactic: 'Exfiltration',
      description: 'Adversaries may steal data by exfiltrating it over an existing command and control channel.',
      url: 'https://attack.mitre.org/techniques/T1041/',
    },
    {
      id: 'T1498',
      techniqueId: 'T1498',
      name: 'Network Denial of Service',
      tactic: 'Impact',
      description: 'Adversaries may conduct Network DoS attacks to degrade or disrupt availability of services.',
      url: 'https://attack.mitre.org/techniques/T1498/',
    },
    {
      id: 'T1548',
      techniqueId: 'T1548',
      name: 'Abuse Elevation Control Mechanism',
      tactic: 'Privilege Escalation',
      description: 'Adversaries may circumvent elevation control mechanisms to gain root or administrator permissions.',
      url: 'https://attack.mitre.org/techniques/T1548/',
    },
    {
      id: 'T1110',
      techniqueId: 'T1110',
      name: 'Brute Force',
      tactic: 'Credential Access',
      description: 'Adversaries may use brute force techniques to systematically guess passwords or tokens.',
      url: 'https://attack.mitre.org/techniques/T1110/',
    },
    {
      id: 'T1083',
      techniqueId: 'T1083',
      name: 'File and Directory Discovery',
      tactic: 'Discovery',
      description: 'Adversaries may enumerate files and directories to locate sensitive information or target binaries.',
      url: 'https://attack.mitre.org/techniques/T1083/',
    },
    {
      id: 'T1018',
      techniqueId: 'T1018',
      name: 'Remote System Discovery',
      tactic: 'Discovery',
      description: 'Adversaries may attempt to get a listing of other systems by IP, hostname, or network property.',
      url: 'https://attack.mitre.org/techniques/T1018/',
    },
    {
      id: 'T1047',
      techniqueId: 'T1047',
      name: 'Windows Management Instrumentation',
      tactic: 'Execution',
      description: 'Adversaries may abuse WMI to execute malicious commands and scripts on local or remote systems.',
      url: 'https://attack.mitre.org/techniques/T1047/',
    },
    {
      id: 'T1547',
      techniqueId: 'T1547',
      name: 'Boot or Logon Autostart Execution',
      tactic: 'Persistence',
      description: 'Adversaries may configure system settings to automatically execute a program upon system startup.',
      url: 'https://attack.mitre.org/techniques/T1547/',
    },
    {
      id: 'T1112',
      techniqueId: 'T1112',
      name: 'Modify Registry',
      tactic: 'Defense Evasion',
      description: 'Adversaries may interact with the Windows Registry to hide configuration information or establish persistence.',
      url: 'https://attack.mitre.org/techniques/T1112/',
    },
  ];

  for (const tech of initialAttackTechniques) {
    const createdTech = await prisma.attackTechnique.upsert({
      where: { id: tech.id },
      update: {
        name: tech.name,
        tactic: tech.tactic,
        description: tech.description,
        url: tech.url,
      },
      create: tech,
    });
    console.log(`[SEED SUCCESS] AttackTechnique seeded: ${createdTech.id} - ${createdTech.name} (${createdTech.tactic})`);
  }

  const initialRules = [
    {
      name: 'Critical Vulnerability Ingested',
      description: 'Triggers when a CVE is ingested with CVSS score >= 9.0',
      severity: 'CRITICAL' as const,
      correlationType: RuleCorrelationType.SIMPLE,
      condition: { type: 'CVSS_SCORE_GT', threshold: 9.0 },
      attackTechniqueIds: ['T1190'],
      enabled: true,
    },
    {
      name: 'Correlated Threat Across Multiple Feeds',
      description: 'Triggers when an IOC is reported across 2 or more distinct threat feeds',
      severity: 'HIGH' as const,
      correlationType: RuleCorrelationType.CORRELATION,
      condition: { type: 'MULTI_SOURCE_IOC', minSources: 2 },
      attackTechniqueIds: ['T1071', 'T1105'],
      enabled: true,
    },
    {
      name: 'High-Risk Threat Tag',
      description: 'Triggers when an IOC contains critical threat tags like botnet, ransomware, or c2',
      severity: 'HIGH' as const,
      correlationType: RuleCorrelationType.SIMPLE,
      condition: { type: 'MATCH_TAGS', tags: ['botnet', 'ransomware', 'c2', 'exploit', 'malware'] },
      attackTechniqueIds: ['T1486', 'T1071'],
      enabled: true,
    },
    {
      name: 'Elevated CVSS Vulnerability',
      description: 'Triggers when a CVE is ingested with CVSS score between 7.5 and 8.9',
      severity: 'MEDIUM' as const,
      correlationType: RuleCorrelationType.SIMPLE,
      condition: { type: 'CVSS_SCORE_GT', threshold: 7.5 },
      attackTechniqueIds: ['T1190'],
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
      attackTechniqueIds: ['T1071', 'T1021'],
      enabled: true,
    },
    {
      name: 'High-Frequency Threat Occurrence Threshold',
      description: 'Triggers when identical threat indicator re-appears 3+ times',
      severity: 'HIGH' as const,
      correlationType: RuleCorrelationType.THRESHOLD,
      condition: { type: 'OCCURRENCE_COUNT', minOccurrences: 3 },
      attackTechniqueIds: ['T1110', 'T1046'],
      enabled: true,
    },
    {
      name: 'Malware Family Exploitation Correlation',
      description: 'Triggers when malware sample is associated with a known CVE',
      severity: 'CRITICAL' as const,
      correlationType: RuleCorrelationType.CORRELATION,
      condition: { type: 'MALWARE_CVE_LINK' },
      attackTechniqueIds: ['T1055', 'T1190'],
      enabled: true,
    },
    {
      name: 'Statistical Anomaly: IOC Ingestion Rate Spike',
      description: 'Triggers when statistical Z-Score threshold (>= 2.5) is exceeded for incoming IOC volume',
      severity: 'CRITICAL' as const,
      correlationType: RuleCorrelationType.STATISTICAL_ANOMALY,
      condition: { type: 'STATISTICAL_ANOMALY', metric: 'IOC_FREQUENCY', zThreshold: 2.5, windowMinutes: 10 },
      attackTechniqueIds: ['T1071', 'T1046'],
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
        attackTechniqueIds: rule.attackTechniqueIds,
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
