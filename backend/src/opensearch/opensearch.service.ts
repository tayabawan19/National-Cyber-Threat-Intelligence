import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class OpenSearchService implements OnModuleInit {
  private readonly logger = new Logger(OpenSearchService.name);
  private client: Client;

  readonly IOC_INDEX = 'ctp-iocs';
  readonly CVE_INDEX = 'ctp-cves';
  readonly MALWARE_INDEX = 'ctp-malware';

  constructor(private configService: ConfigService) {
    const node = this.configService.get<string>('OPENSEARCH_NODE') || 'http://localhost:9200';
    this.client = new Client({
      node,
      ssl: { rejectUnauthorized: false },
      requestTimeout: 1500,
      maxRetries: 0,
    });
  }

  async onModuleInit() {
    await this.ensureIndicesExist();
  }

  async ensureIndicesExist() {
    try {
      const iocExists = await this.client.indices.exists({ index: this.IOC_INDEX });
      if (!iocExists.body) {
        await this.client.indices.create({
          index: this.IOC_INDEX,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                type: { type: 'keyword' },
                value: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                source: { type: 'keyword' },
                tags: { type: 'keyword' },
                firstSeen: { type: 'date' },
                lastSeen: { type: 'date' },
                createdAt: { type: 'date' },
              },
            },
          },
        });
        this.logger.log(`Created OpenSearch index '${this.IOC_INDEX}'`);
      }

      const cveExists = await this.client.indices.exists({ index: this.CVE_INDEX });
      if (!cveExists.body) {
        await this.client.indices.create({
          index: this.CVE_INDEX,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                cveId: { type: 'keyword' },
                description: { type: 'text' },
                cvssScore: { type: 'float' },
                source: { type: 'keyword' },
                publishedDate: { type: 'date' },
                lastModifiedDate: { type: 'date' },
                createdAt: { type: 'date' },
              },
            },
          },
        });
        this.logger.log(`Created OpenSearch index '${this.CVE_INDEX}'`);
      }

      const malwareExists = await this.client.indices.exists({ index: this.MALWARE_INDEX });
      if (!malwareExists.body) {
        await this.client.indices.create({
          index: this.MALWARE_INDEX,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                malwareFamily: { type: 'keyword' },
                hashMd5: { type: 'keyword' },
                hashSha1: { type: 'keyword' },
                hashSha256: { type: 'keyword' },
                fileType: { type: 'keyword' },
                source: { type: 'keyword' },
                tags: { type: 'keyword' },
                firstSeen: { type: 'date' },
                lastSeen: { type: 'date' },
                createdAt: { type: 'date' },
              },
            },
          },
        });
        this.logger.log(`Created OpenSearch index '${this.MALWARE_INDEX}'`);
      }
    } catch (error: any) {
      this.logger.warn(`OpenSearch cluster initialization warning (may be starting up): ${error.message}`);
    }
  }

  async indexIoc(ioc: any) {
    try {
      await this.client.index({
        index: this.IOC_INDEX,
        id: ioc.id,
        body: {
          id: ioc.id,
          type: ioc.type,
          value: ioc.value,
          source: ioc.source,
          tags: ioc.tags || [],
          firstSeen: ioc.firstSeen,
          lastSeen: ioc.lastSeen,
          createdAt: ioc.createdAt,
        },
        refresh: true,
      });
    } catch (error: any) {
      this.logger.error(`Failed to index IOC ${ioc.id} in OpenSearch: ${error.message}`);
    }
  }

  async indexCve(cve: any) {
    try {
      await this.client.index({
        index: this.CVE_INDEX,
        id: cve.id,
        body: {
          id: cve.id,
          cveId: cve.cveId,
          description: cve.description,
          cvssScore: cve.cvssScore,
          source: cve.source,
          publishedDate: cve.publishedDate,
          lastModifiedDate: cve.lastModifiedDate,
          createdAt: cve.createdAt,
        },
        refresh: true,
      });
    } catch (error: any) {
      this.logger.error(`Failed to index CVE ${cve.id} in OpenSearch: ${error.message}`);
    }
  }

  async indexMalware(malware: any) {
    try {
      await this.client.index({
        index: this.MALWARE_INDEX,
        id: malware.id,
        body: {
          id: malware.id,
          name: malware.name,
          malwareFamily: malware.malwareFamily,
          hashMd5: malware.hashMd5,
          hashSha1: malware.hashSha1,
          hashSha256: malware.hashSha256,
          fileType: malware.fileType,
          source: malware.source,
          tags: malware.tags || [],
          firstSeen: malware.firstSeen,
          lastSeen: malware.lastSeen,
          createdAt: malware.createdAt,
        },
        refresh: true,
      });
    } catch (error: any) {
      this.logger.error(`Failed to index Malware Sample ${malware.id} in OpenSearch: ${error.message}`);
    }
  }

  async searchIocs(query: string, page = 1, limit = 20) {
    try {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 20);
      const from = (pageNum - 1) * limitNum;

      const response = await this.client.search({
        index: this.IOC_INDEX,
        body: {
          from,
          size: limitNum,
          query: {
            multi_match: {
              query,
              fields: ['value^3', 'tags^2', 'type', 'source'],
              fuzziness: 'AUTO',
            },
          },
        },
      });

      const hits = response.body?.hits?.hits || [];
      const rawTotal = response.body?.hits?.total;
      const total = typeof rawTotal === 'number' ? rawTotal : (rawTotal as any)?.value || hits.length;
      const data = hits.map((hit: any) => hit._source);

      return { data, total, page: pageNum, limit: limitNum };
    } catch (error: any) {
      this.logger.warn(`OpenSearch searchIocs failed, fallback needed: ${error.message}`);
      return null;
    }
  }

  async searchCves(query: string, page = 1, limit = 20) {
    try {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 20);
      const from = (pageNum - 1) * limitNum;

      const response = await this.client.search({
        index: this.CVE_INDEX,
        body: {
          from,
          size: limitNum,
          query: {
            multi_match: {
              query,
              fields: ['cveId^3', 'description^2', 'source'],
              fuzziness: 'AUTO',
            },
          },
        },
      });

      const hits = response.body?.hits?.hits || [];
      const rawTotal = response.body?.hits?.total;
      const total = typeof rawTotal === 'number' ? rawTotal : (rawTotal as any)?.value || hits.length;
      const data = hits.map((hit: any) => hit._source);

      return { data, total, page: pageNum, limit: limitNum };
    } catch (error: any) {
      this.logger.warn(`OpenSearch searchCves failed, fallback needed: ${error.message}`);
      return null;
    }
  }

  async searchMalware(query: string, page = 1, limit = 20) {
    try {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 20);
      const from = (pageNum - 1) * limitNum;

      const response = await this.client.search({
        index: this.MALWARE_INDEX,
        body: {
          from,
          size: limitNum,
          query: {
            multi_match: {
              query,
              fields: ['name^3', 'malwareFamily^3', 'hashSha256^4', 'hashMd5', 'fileType', 'tags^2'],
              fuzziness: 'AUTO',
            },
          },
        },
      });

      const hits = response.body?.hits?.hits || [];
      const rawTotal = response.body?.hits?.total;
      const total = typeof rawTotal === 'number' ? rawTotal : (rawTotal as any)?.value || hits.length;
      const data = hits.map((hit: any) => hit._source);

      return { data, total, page: pageNum, limit: limitNum };
    } catch (error: any) {
      this.logger.warn(`OpenSearch searchMalware failed, fallback needed: ${error.message}`);
      return null;
    }
  }

  async reindexAll(iocs: any[], cves: any[], malwareSamples: any[] = []) {
    await this.ensureIndicesExist();

    let iocIndexed = 0;
    let cveIndexed = 0;
    let malwareIndexed = 0;

    for (const ioc of iocs) {
      await this.indexIoc(ioc);
      iocIndexed++;
    }

    for (const cve of cves) {
      await this.indexCve(cve);
      cveIndexed++;
    }

    for (const m of malwareSamples) {
      await this.indexMalware(m);
      malwareIndexed++;
    }

    return {
      status: 'SUCCESS',
      iocsReindexed: iocIndexed,
      cvesReindexed: cveIndexed,
      malwareReindexed: malwareIndexed,
      iocIndexed,
      cveIndexed,
      malwareIndexed,
    };
  }
}
