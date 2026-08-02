import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenSearchService } from '../opensearch/opensearch.service';
import { CreateIocDto } from './dto/create-ioc.dto';
import { UpdateIocDto } from './dto/update-ioc.dto';

@Injectable()
export class IocsService {
  constructor(
    private prisma: PrismaService,
    private openSearchService: OpenSearchService,
  ) {}

  async create(dto: CreateIocDto) {
    const ioc = await this.prisma.ioc.create({
      data: {
        type: dto.type,
        value: dto.value,
        source: dto.source,
        relatedCaseId: dto.relatedCaseId || null,
      },
      include: {
        relatedCase: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    await this.openSearchService.indexIoc(ioc);
    return ioc;
  }

  async findAll(page = 1, limit = 20) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      this.prisma.ioc.findMany({
        skip,
        take: limitNum,
        include: {
          relatedCase: {
            select: { id: true, title: true, status: true },
          },
          alerts: {
            select: { id: true, source: true, severity: true, description: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ioc.count(),
    ]);

    return {
      total,
      page: pageNum,
      limit: limitNum,
      data,
    };
  }

  async search(query: string, page = 1, limit = 20) {
    return this.openSearchService.searchIocs(query, Number(page) || 1, Number(limit) || 20);
  }

  async findOne(id: string) {
    const ioc = await this.prisma.ioc.findUnique({
      where: { id },
      include: {
        relatedCase: true,
        alerts: true,
      },
    });

    if (!ioc) {
      throw new NotFoundException(`IOC with ID '${id}' not found.`);
    }

    return ioc;
  }

  async update(id: string, dto: UpdateIocDto) {
    await this.findOne(id);

    const updated = await this.prisma.ioc.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.value && { value: dto.value }),
        ...(dto.source && { source: dto.source }),
        ...(dto.relatedCaseId !== undefined && { relatedCaseId: dto.relatedCaseId }),
        lastSeen: new Date(),
      },
      include: {
        relatedCase: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    await this.openSearchService.indexIoc(updated);
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ioc.delete({
      where: { id },
      select: { id: true, value: true },
    });
  }
}
