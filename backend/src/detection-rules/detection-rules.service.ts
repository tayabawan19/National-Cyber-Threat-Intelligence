import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Severity } from '@prisma/client';

export interface CreateRuleDto {
  name: string;
  description?: string;
  condition: any;
  severity: Severity;
  enabled?: boolean;
}

export interface UpdateRuleDto {
  name?: string;
  description?: string;
  condition?: any;
  severity?: Severity;
  enabled?: boolean;
}

@Injectable()
export class DetectionRulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.detectionRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { alerts: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.detectionRule.findUnique({
      where: { id },
      include: { alerts: true },
    });
    if (!rule) {
      throw new NotFoundException(`Detection Rule #${id} not found`);
    }
    return rule;
  }

  async create(dto: CreateRuleDto) {
    return this.prisma.detectionRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        condition: dto.condition,
        severity: dto.severity,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateRuleDto) {
    await this.findOne(id);
    return this.prisma.detectionRule.update({
      where: { id },
      data: dto,
    });
  }
}
