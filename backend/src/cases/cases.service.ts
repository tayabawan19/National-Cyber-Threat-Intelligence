import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService } from '../llm/groq.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private groqService: GroqService,
  ) {}

  async create(dto: CreateCaseDto) {
    return this.prisma.case.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        severity: dto.severity,
        assignedToId: dto.assignedToId || null,
      },
      include: {
        assignedTo: {
          select: { id: true, email: true, role: true },
        },
        alerts: {
          include: {
            sourceIoc: true,
            sourceCve: true,
            sourceMalware: true,
            rule: true,
          },
        },
        iocs: true,
      },
    });
  }

  async findAll() {
    return this.prisma.case.findMany({
      include: {
        assignedTo: {
          select: { id: true, email: true, role: true },
        },
        alerts: {
          include: {
            sourceIoc: true,
            sourceCve: true,
            sourceMalware: true,
            rule: true,
          },
        },
        iocs: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const caseItem = await this.prisma.case.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, email: true, role: true },
        },
        alerts: {
          include: {
            sourceIoc: true,
            sourceCve: true,
            sourceMalware: true,
            rule: true,
          },
        },
        iocs: true,
        forensicArtifacts: true,
      },
    });

    if (!caseItem) {
      throw new NotFoundException(`Case with ID '${id}' not found.`);
    }

    // Collect all related CVEs & Malware samples from linked alerts and IOCs
    const cveIds = new Set<string>();
    const malwareIds = new Set<string>();

    caseItem.alerts.forEach((alert) => {
      if (alert.sourceCve?.cveId) cveIds.add(alert.sourceCve.cveId);
      if (alert.sourceMalware?.id) malwareIds.add(alert.sourceMalware.id);
    });

    // Also fetch malware samples related to case IOCs
    const iocIds = caseItem.iocs.map((i) => i.id);
    let linkedMalware: any[] = [];
    if (iocIds.length > 0) {
      linkedMalware = await this.prisma.malwareSample.findMany({
        where: { relatedIocId: { in: iocIds } },
      });
      linkedMalware.forEach((m) => {
        malwareIds.add(m.id);
        (m.relatedCveIds || []).forEach((cveId: string) => cveIds.add(cveId));
      });
    }

    const [cves, malwareSamples] = await Promise.all([
      cveIds.size > 0
        ? this.prisma.cve.findMany({ where: { cveId: { in: Array.from(cveIds) } } })
        : [],
      malwareIds.size > 0
        ? this.prisma.malwareSample.findMany({ where: { id: { in: Array.from(malwareIds) } } })
        : [],
    ]);

    return {
      ...caseItem,
      cves,
      malwareSamples,
    };
  }

  async update(id: string, dto: UpdateCaseDto) {
    await this.findOne(id);

    return this.prisma.case.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status && { status: dto.status }),
        ...(dto.severity && { severity: dto.severity }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
      },
      include: {
        assignedTo: {
          select: { id: true, email: true, role: true },
        },
        alerts: {
          include: {
            sourceIoc: true,
            sourceCve: true,
            sourceMalware: true,
            rule: true,
          },
        },
        iocs: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.case.delete({
      where: { id },
      select: { id: true, title: true },
    });
  }

  async getTimeline(id: string) {
    await this.findOne(id);

    const alertItems = await this.prisma.alert.findMany({
      where: { relatedCaseId: id },
      select: { id: true },
    });
    const alertIds = alertItems.map((a) => a.id);

    return this.prisma.auditLog.findMany({
      where: {
        OR: [
          { targetEntity: 'CASES', targetId: id },
          { targetEntity: 'ALERTS', targetId: { in: alertIds } },
        ],
      },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async addNote(id: string, userId: string, noteText: string) {
    await this.findOne(id);

    return this.prisma.auditLog.create({
      data: {
        userId,
        action: `NOTE: ${noteText}`,
        targetEntity: 'CASES',
        targetId: id,
      },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  async generateIncidentReport(id: string) {
    const caseData = await this.findOne(id);
    const report = await this.groqService.generateIncidentReport(caseData);

    const updated = await this.prisma.case.update({
      where: { id },
      data: {
        incidentReport: report as any,
      },
      include: {
        assignedTo: { select: { id: true, email: true, role: true } },
        alerts: true,
        iocs: true,
        forensicArtifacts: true,
      },
    });

    return {
      ...updated,
      report,
    };
  }
}
