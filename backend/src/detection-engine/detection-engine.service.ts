import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService } from '../llm/groq.service';
import { Severity, RuleCorrelationType } from '@prisma/client';

@Injectable()
export class DetectionEngineService {
  private readonly logger = new Logger(DetectionEngineService.name);

  constructor(
    private prisma: PrismaService,
    private groqService: GroqService,
  ) {}

  async evaluateIoc(iocId: string): Promise<void> {
    try {
      const ioc = await this.prisma.ioc.findUnique({ where: { id: iocId } });
      if (!ioc) return;

      const enabledRules = await this.prisma.detectionRule.findMany({
        where: { enabled: true },
      });

      for (const rule of enabledRules) {
        const isMatch = await this.checkRuleMatch(rule, 'IOC', ioc);
        if (isMatch) {
          await this.createOrDeduplicateAlert({
            source: ioc.source,
            description: `Detection Rule '${rule.name}' triggered for IOC (${ioc.value}) [Type: ${ioc.type}]`,
            severity: rule.severity,
            sourceIocId: ioc.id,
            ruleId: rule.id,
            entityType: 'IOC',
            entityValue: ioc.value,
            ruleName: rule.name,
            details: { type: ioc.type, tags: ioc.tags, firstSeen: ioc.firstSeen },
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Error evaluating detection rules for IOC ${iocId}: ${err.message}`, err.stack);
    }
  }

  async evaluateCve(cveId: string): Promise<void> {
    try {
      const cve = await this.prisma.cve.findUnique({ where: { id: cveId } });
      if (!cve) return;

      const enabledRules = await this.prisma.detectionRule.findMany({
        where: { enabled: true },
      });

      for (const rule of enabledRules) {
        const isMatch = await this.checkRuleMatch(rule, 'CVE', cve);
        if (isMatch) {
          await this.createOrDeduplicateAlert({
            source: cve.source,
            description: `Detection Rule '${rule.name}' triggered for CVE ${cve.cveId} (CVSS: ${cve.cvssScore})`,
            severity: rule.severity,
            sourceCveId: cve.id,
            ruleId: rule.id,
            entityType: 'CVE',
            entityValue: cve.cveId,
            ruleName: rule.name,
            details: { cveId: cve.cveId, cvssScore: cve.cvssScore, description: cve.description },
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Error evaluating detection rules for CVE ${cveId}: ${err.message}`, err.stack);
    }
  }

  async evaluateMalware(malwareId: string): Promise<void> {
    try {
      const malware = await this.prisma.malwareSample.findUnique({
        where: { id: malwareId },
        include: { relatedIoc: true },
      });
      if (!malware) return;

      const enabledRules = await this.prisma.detectionRule.findMany({
        where: { enabled: true },
      });

      for (const rule of enabledRules) {
        const isMatch = await this.checkRuleMatch(rule, 'MALWARE', malware);
        if (isMatch) {
          await this.createOrDeduplicateAlert({
            source: malware.source,
            description: `Detection Rule '${rule.name}' triggered for Malware ${malware.name} [Family: ${malware.malwareFamily || 'Unknown'}]`,
            severity: rule.severity,
            sourceMalwareId: malware.id,
            sourceIocId: malware.relatedIocId || undefined,
            ruleId: rule.id,
            entityType: 'MALWARE',
            entityValue: malware.hashSha256,
            ruleName: rule.name,
            details: {
              name: malware.name,
              malwareFamily: malware.malwareFamily,
              hashSha256: malware.hashSha256,
              tags: malware.tags,
            },
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Error evaluating detection rules for Malware ${malwareId}: ${err.message}`, err.stack);
    }
  }

  private async checkRuleMatch(rule: any, entityType: 'IOC' | 'CVE' | 'MALWARE', entity: any): Promise<boolean> {
    const condition = rule.condition as any;
    if (!condition) return false;

    // 1. Multi-Condition Rule Logic (AND / OR)
    if (rule.correlationType === RuleCorrelationType.MULTI_CONDITION || condition.logicalOperator || Array.isArray(condition.conditions)) {
      const op = (condition.logicalOperator || 'AND').toUpperCase();
      const subConditions = condition.conditions || [];
      if (subConditions.length === 0) return false;

      const results = await Promise.all(
        subConditions.map((cond: any) => this.evaluateSingleCondition(cond, entityType, entity)),
      );

      return op === 'OR' ? results.some(Boolean) : results.every(Boolean);
    }

    // 2. Threshold Rule Logic
    if (rule.correlationType === RuleCorrelationType.THRESHOLD || condition.type === 'OCCURRENCE_COUNT' || condition.type === 'IOC_COUNT_FROM_SOURCE') {
      if (condition.type === 'IOC_COUNT_FROM_SOURCE' && entityType === 'IOC') {
        const minCount = condition.minCount || condition.minOccurrences || 5;
        const count = await this.prisma.ioc.count({
          where: { source: entity.source },
        });
        return count >= minCount;
      }

      const minOccurrences = condition.minOccurrences || condition.minCount || 3;
      if (entityType === 'IOC') {
        const existingAlert = await this.prisma.alert.findFirst({
          where: { sourceIocId: entity.id, ruleId: rule.id },
        });
        // Check if upcoming occurrence would hit threshold
        return ((existingAlert?.occurrenceCount || 0) + 1) >= minOccurrences;
      }
      return false;
    }

    // 3. Correlation Rule Logic
    if (rule.correlationType === RuleCorrelationType.CORRELATION || condition.type === 'MALWARE_CVE_LINK' || condition.type === 'MULTI_SOURCE_IOC' || condition.type === 'IOC_CVE_CORRELATION') {
      if (condition.type === 'MALWARE_CVE_LINK' && entityType === 'MALWARE') {
        return (entity.relatedCveIds || []).length > 0 || Boolean(entity.rawPayload?.cveId);
      }

      if (condition.type === 'MULTI_SOURCE_IOC' && entityType === 'IOC') {
        const minSources = condition.minSources || 2;
        const count = await this.prisma.ioc.count({ where: { value: entity.value } });
        return count >= minSources;
      }

      if (condition.type === 'IOC_CVE_CORRELATION') {
        const threshold = condition.threshold || 9.0;
        // Check if IOC or Malware links to a CVE in DB with CVSS >= threshold
        const cveIds = (entity.relatedCveIds || entity.rawPayload?.cveIds || entity.rawPayload?.cveId ? [entity.rawPayload?.cveId] : []).filter(Boolean);
        if (cveIds.length === 0) return false;

        const matchingCve = await this.prisma.cve.findFirst({
          where: {
            cveId: { in: cveIds },
            cvssScore: { gte: threshold },
          },
        });
        return Boolean(matchingCve);
      }
    }

    // 4. Simple Condition Fallback Logic
    return this.evaluateSingleCondition(condition, entityType, entity);
  }

  private async evaluateSingleCondition(condition: any, entityType: 'IOC' | 'CVE' | 'MALWARE', entity: any): Promise<boolean> {
    if (!condition || !condition.type) return false;

    switch (condition.type) {
      case 'MATCH_TAGS': {
        const tags = (condition.tags || []).map((t: string) => t.toLowerCase());
        const entityTags = (entity.tags || []).map((t: string) => t.toLowerCase());
        return tags.some((t: string) => entityTags.includes(t));
      }
      case 'CVSS_SCORE_GT': {
        if (entityType !== 'CVE') return false;
        const threshold = condition.threshold || 7.0;
        return entity.cvssScore !== null && entity.cvssScore !== undefined && entity.cvssScore >= threshold;
      }
      case 'MULTI_SOURCE_IOC': {
        if (entityType !== 'IOC') return false;
        const minSources = condition.minSources || 2;
        const count = await this.prisma.ioc.count({ where: { value: entity.value } });
        return count >= minSources;
      }
      default:
        return false;
    }
  }

  private async createOrDeduplicateAlert(params: {
    source: string;
    description: string;
    severity: Severity;
    sourceIocId?: string;
    sourceCveId?: string;
    sourceMalwareId?: string;
    ruleId: string;
    entityType: 'IOC' | 'CVE' | 'MALWARE';
    entityValue: string;
    ruleName: string;
    details: any;
  }) {
    // 1. Check for duplicate alert on same entity & rule in NEW or TRIAGED status
    const existingAlert = await this.prisma.alert.findFirst({
      where: {
        ruleId: params.ruleId,
        status: { in: ['NEW', 'TRIAGED'] },
        OR: [
          ...(params.sourceIocId ? [{ sourceIocId: params.sourceIocId }] : []),
          ...(params.sourceCveId ? [{ sourceCveId: params.sourceCveId }] : []),
          ...(params.sourceMalwareId ? [{ sourceMalwareId: params.sourceMalwareId }] : []),
        ],
      },
    });

    if (existingAlert) {
      // DEDUPLICATION HIT: Increment occurrenceCount & update lastSeen
      const updated = await this.prisma.alert.update({
        where: { id: existingAlert.id },
        data: {
          occurrenceCount: existingAlert.occurrenceCount + 1,
          lastSeen: new Date(),
        },
      });

      this.logger.log(
        `[ALERT DEDUPLICATION] Incremented occurrenceCount to ${updated.occurrenceCount} for Alert #${updated.id} (${params.ruleName})`,
      );
      return updated;
    }

    // 2. No existing alert: Calculate score & generate Groq LLM Advisory Severity / Summary
    let score = 5.0;
    switch (params.severity) {
      case Severity.CRITICAL:
        score = 9.8;
        break;
      case Severity.HIGH:
        score = 8.2;
        break;
      case Severity.MEDIUM:
        score = 5.5;
        break;
      case Severity.LOW:
        score = 2.5;
        break;
    }

    const threatCtx = {
      entityType: params.entityType,
      value: params.entityValue,
      ruleName: params.ruleName,
      severity: params.severity,
      details: params.details,
    };

    let llmExplanation: string | null = null;
    let llmSuggestedSeverity: Severity | null = null;

    if (params.severity === Severity.HIGH || params.severity === Severity.CRITICAL) {
      llmExplanation = await this.groqService.generateExplanation(threatCtx);
    }

    llmSuggestedSeverity = await this.groqService.suggestSeverity(threatCtx);

    const alert = await this.prisma.alert.create({
      data: {
        source: params.source,
        description: params.description,
        severity: params.severity,
        status: 'NEW',
        score,
        occurrenceCount: 1,
        lastSeen: new Date(),
        llmExplanation,
        llmSuggestedSeverity,
        sourceIocId: params.sourceIocId || null,
        sourceCveId: params.sourceCveId || null,
        sourceMalwareId: params.sourceMalwareId || null,
        ruleId: params.ruleId,
      },
    });

    this.logger.log(
      `Created Alert #${alert.id} [Severity: ${alert.severity}] [LLM Advisory: ${alert.llmSuggestedSeverity || 'N/A'}] via Rule '${params.ruleName}'`,
    );

    return alert;
  }
}
