import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AlertStatus, Severity } from '@prisma/client';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAlertDto) {
    return this.prisma.alert.create({
      data: {
        source: dto.source,
        description: dto.description,
        severity: dto.severity,
        status: dto.status || 'NEW',
        relatedCaseId: dto.relatedCaseId || null,
      },
      include: {
        sourceIoc: true,
        sourceCve: true,
        sourceMalware: true,
        rule: true,
        relatedCase: {
          select: { id: true, title: true, status: true },
        },
      },
    });
  }

  async findAll(status?: AlertStatus, severity?: Severity, page = 1, limit = 50) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 50);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [items, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        include: {
          sourceIoc: true,
          sourceCve: true,
          sourceMalware: true,
          rule: true,
          relatedCase: {
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.alert.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        sourceIoc: true,
        sourceCve: true,
        sourceMalware: true,
        rule: true,
        relatedCase: true,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID '${id}' not found.`);
    }

    let relatedCves: any[] = [];
    let relatedMalware: any[] = [];

    if (alert.sourceIoc) {
      // Find malware samples associated with this IOC
      relatedMalware = await this.prisma.malwareSample.findMany({
        where: { relatedIocId: alert.sourceIoc.id },
      });

      // Extract referenced CVE IDs from IOC rawPayload or related malware
      const rawPayload = alert.sourceIoc.rawPayload as any;
      const iocCveId = rawPayload?.cveId || rawPayload?.cve;
      const malwareCveIds = relatedMalware.flatMap((m) => m.relatedCveIds || []);
      const allCveIds = Array.from(new Set([...(iocCveId ? [iocCveId] : []), ...malwareCveIds]));

      if (allCveIds.length > 0) {
        relatedCves = await this.prisma.cve.findMany({
          where: { cveId: { in: allCveIds } },
        });
      }
    } else if (alert.sourceMalware) {
      // Find CVEs matching malware's relatedCveIds
      if (alert.sourceMalware.relatedCveIds?.length > 0) {
        relatedCves = await this.prisma.cve.findMany({
          where: { cveId: { in: alert.sourceMalware.relatedCveIds } },
        });
      }
    } else if (alert.sourceCve) {
      // Find malware samples matching this CVE
      relatedMalware = await this.prisma.malwareSample.findMany({
        where: { relatedCveIds: { has: alert.sourceCve.cveId } },
      });
    }

    return {
      ...alert,
      relatedCves,
      relatedMalware,
    };
  }

  async update(id: string, dto: UpdateAlertDto) {
    await this.findOne(id);

    return this.prisma.alert.update({
      where: { id },
      data: {
        ...(dto.source && { source: dto.source }),
        ...(dto.description && { description: dto.description }),
        ...(dto.severity && { severity: dto.severity }),
        ...(dto.status && { status: dto.status }),
        ...(dto.relatedCaseId !== undefined && { relatedCaseId: dto.relatedCaseId }),
      },
      include: {
        sourceIoc: true,
        sourceCve: true,
        sourceMalware: true,
        rule: true,
        relatedCase: {
          select: { id: true, title: true, status: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.alert.delete({
      where: { id },
      select: { id: true, source: true },
    });
  }
}
