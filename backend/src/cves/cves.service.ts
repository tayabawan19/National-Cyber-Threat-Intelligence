import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenSearchService } from '../opensearch/opensearch.service';

@Injectable()
export class CvesService {
  constructor(
    private prisma: PrismaService,
    private openSearchService: OpenSearchService,
  ) {}

  async findAll(page = 1, limit = 20) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      this.prisma.cve.findMany({
        skip,
        take: limitNum,
        orderBy: { publishedDate: 'desc' },
      }),
      this.prisma.cve.count(),
    ]);

    return {
      total,
      page: pageNum,
      limit: limitNum,
      data,
    };
  }

  async search(query: string, page = 1, limit = 20) {
    return this.openSearchService.searchCves(query, Number(page) || 1, Number(limit) || 20);
  }

  async findOne(id: string) {
    const cve = await this.prisma.cve.findFirst({
      where: {
        OR: [{ id }, { cveId: id }],
      },
    });

    if (!cve) {
      throw new NotFoundException(`CVE record '${id}' not found.`);
    }

    return cve;
  }
}
