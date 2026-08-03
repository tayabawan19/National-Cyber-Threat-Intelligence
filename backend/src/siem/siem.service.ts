import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Severity } from '@prisma/client';

export interface SiemExportOptions {
  format?: 'cef' | 'json';
  startTime?: string;
  endTime?: string;
  severity?: Severity;
  apiKey?: string;
}

@Injectable()
export class SiemService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  validateApiKey(providedApiKey?: string) {
    const configuredKey = this.configService.get<string>('SIEM_API_KEY') || 'siem_secret_service_key_2026';
    if (!providedApiKey || providedApiKey !== configuredKey) {
      throw new UnauthorizedException('Invalid or missing SIEM API Key (X-SIEM-API-KEY)');
    }
  }

  async exportAlerts(options: SiemExportOptions) {
    const { format = 'json', startTime, endTime, severity } = options;

    const where: any = {};

    if (severity) {
      where.severity = severity;
    }

    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt.gte = new Date(startTime);
      }
      if (endTime) {
        where.createdAt.lte = new Date(endTime);
      }
    }

    const alerts = await this.prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        sourceIoc: { select: { value: true, type: true, source: true } },
        sourceCve: { select: { cveId: true, cvssScore: true } },
        sourceMalware: { select: { hashSha256: true, name: true } },
        relatedCase: { select: { id: true, title: true, status: true } },
      },
    });

    if (format === 'cef') {
      const cefLines = alerts.map((alert) => this.formatCefLine(alert));
      return {
        format: 'cef',
        count: alerts.length,
        data: cefLines.join('\n'),
      };
    }

    return {
      format: 'json',
      count: alerts.length,
      timestamp: new Date().toISOString(),
      alerts: alerts.map((alert) => ({
        id: alert.id,
        source: alert.source,
        description: alert.description,
        severity: alert.severity,
        status: alert.status,
        score: alert.score,
        occurrenceCount: alert.occurrenceCount,
        lastSeen: alert.lastSeen,
        llmSuggestedSeverity: alert.llmSuggestedSeverity,
        relatedIoc: alert.sourceIoc?.value || null,
        relatedIocType: alert.sourceIoc?.type || null,
        relatedCve: alert.sourceCve?.cveId || null,
        relatedMalware: alert.sourceMalware?.hashSha256 || null,
        caseId: alert.relatedCaseId || null,
        createdAt: alert.createdAt,
      })),
    };
  }

  private formatCefLine(alert: any): string {
    const version = 0;
    const vendor = 'NationalCyberIntel';
    const product = 'ThreatPlatform';
    const devVersion = '1.0';
    const sigId = alert.id;
    const name = (alert.description || 'Threat Alert').replace(/\|/g, '\\|');
    const severity = this.mapSeverityToCef(alert.severity);

    const extensions: string[] = [
      `rt=${Math.floor(new Date(alert.createdAt).getTime() / 1000)}`,
      `cat=${alert.source || 'ThreatEngine'}`,
      `cnt=${alert.occurrenceCount || 1}`,
      `stat=${alert.status}`,
    ];

    if (alert.sourceIoc?.value) {
      if (alert.sourceIoc.type === 'IP') extensions.push(`src=${alert.sourceIoc.value}`);
      else extensions.push(`cs1=${alert.sourceIoc.value} cs1Label=IOCValue`);
    }

    if (alert.sourceCve?.cveId) {
      extensions.push(`cs2=${alert.sourceCve.cveId} cs2Label=CVEID`);
    }

    if (alert.sourceMalware?.hashSha256) {
      extensions.push(`fileHash=${alert.sourceMalware.hashSha256}`);
    }

    if (alert.relatedCaseId) {
      extensions.push(`cs3=${alert.relatedCaseId} cs3Label=CaseID`);
    }

    return `CEF:${version}|${vendor}|${product}|${devVersion}|${sigId}|${name}|${severity}|${extensions.join(' ')}`;
  }

  private mapSeverityToCef(severity: Severity): number {
    switch (severity) {
      case 'CRITICAL':
        return 10;
      case 'HIGH':
        return 8;
      case 'MEDIUM':
        return 5;
      case 'LOW':
        return 2;
      default:
        return 3;
    }
  }
}
