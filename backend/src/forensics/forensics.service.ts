import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ForensicArtifactType } from '@prisma/client';

export interface CreateArtifactDto {
  caseId: string;
  artifactType: ForensicArtifactType;
  description?: string;
  hash?: string;
  relatedIocId?: string;
  relatedAlertId?: string;
  initialAction?: string;
}

export interface CustodyActionDto {
  action: string;
}

@Injectable()
export class ForensicsService {
  constructor(private prisma: PrismaService) {}

  async createArtifact(dto: CreateArtifactDto, userEmail: string) {
    const caseExists = await this.prisma.case.findUnique({
      where: { id: dto.caseId },
    });

    if (!caseExists) {
      throw new NotFoundException(`Case with ID '${dto.caseId}' not found`);
    }

    const initialCustodyEntry = {
      user: userEmail || 'System Investigator',
      action: dto.initialAction || 'Artifact Attached to Case',
      timestamp: new Date().toISOString(),
    };

    return this.prisma.forensicArtifact.create({
      data: {
        caseId: dto.caseId,
        artifactType: dto.artifactType,
        description: dto.description || null,
        hash: dto.hash || null,
        collectedBy: userEmail || 'System Investigator',
        chainOfCustody: [initialCustodyEntry],
        relatedIocId: dto.relatedIocId || null,
        relatedAlertId: dto.relatedAlertId || null,
      },
    });
  }

  async appendCustodyAction(artifactId: string, actionText: string, userEmail: string) {
    const artifact = await this.prisma.forensicArtifact.findUnique({
      where: { id: artifactId },
    });

    if (!artifact) {
      throw new NotFoundException(`Forensic artifact with ID '${artifactId}' not found`);
    }

    if (!actionText || typeof actionText !== 'string' || !actionText.trim()) {
      throw new BadRequestException('Action description is required to append to chain-of-custody');
    }

    const currentChain = Array.isArray(artifact.chainOfCustody) ? (artifact.chainOfCustody as any[]) : [];
    
    const newEntry = {
      user: userEmail || 'System Investigator',
      action: actionText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedChain = [...currentChain, newEntry];

    return this.prisma.forensicArtifact.update({
      where: { id: artifactId },
      data: {
        chainOfCustody: updatedChain,
      },
    });
  }

  async findByCase(caseId: string) {
    const caseExists = await this.prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseExists) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    return this.prisma.forensicArtifact.findMany({
      where: { caseId },
      orderBy: { collectedAt: 'desc' },
      include: {
        relatedIoc: { select: { id: true, value: true, type: true } },
        relatedAlert: { select: { id: true, description: true, severity: true } },
      },
    });
  }

  rejectEditOrDelete() {
    throw new BadRequestException(
      'Chain-of-custody is append-only. Modifying or deleting existing forensic artifact chain-of-custody entries is strictly prohibited by forensic policy.'
    );
  }
}
