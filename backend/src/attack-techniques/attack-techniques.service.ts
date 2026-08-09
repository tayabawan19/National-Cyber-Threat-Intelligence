import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TACTIC_ORDER = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact',
];

@Injectable()
export class AttackTechniquesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.attackTechnique.findMany({
      orderBy: [{ tactic: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: string) {
    const tech = await this.prisma.attackTechnique.findUnique({
      where: { id },
    });
    if (!tech) {
      throw new NotFoundException(`ATT&CK Technique with ID '${id}' not found.`);
    }
    return tech;
  }

  async getMatrix() {
    const techniques = await this.prisma.attackTechnique.findMany({
      orderBy: { id: 'asc' },
    });

    const alerts = await this.prisma.alert.findMany({
      select: { id: true, attackTechniqueIds: true },
    });

    // Count observed alerts per technique ID
    const countMap: Record<string, number> = {};
    let totalObservedAlerts = 0;

    for (const alert of alerts) {
      if (alert.attackTechniqueIds && alert.attackTechniqueIds.length > 0) {
        totalObservedAlerts++;
        for (const techId of alert.attackTechniqueIds) {
          countMap[techId] = (countMap[techId] || 0) + 1;
        }
      }
    }

    // Group techniques by tactic in standard MITRE order
    const matrixByTactic: Record<string, any[]> = {};
    for (const tactic of TACTIC_ORDER) {
      matrixByTactic[tactic] = [];
    }

    for (const tech of techniques) {
      const tacticName = tech.tactic;
      if (!matrixByTactic[tacticName]) {
        matrixByTactic[tacticName] = [];
      }
      matrixByTactic[tacticName].push({
        ...tech,
        observedCount: countMap[tech.id] || 0,
      });
    }

    return {
      tactics: matrixByTactic,
      meta: {
        totalTechniquesSeeded: techniques.length,
        totalObservedAlerts,
        tacticOrder: TACTIC_ORDER,
      },
    };
  }
}
