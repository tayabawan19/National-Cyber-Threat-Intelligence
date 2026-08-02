import { Test, TestingModule } from '@nestjs/testing';
import { OpenSearchService } from './opensearch.service';
import { ConfigService } from '@nestjs/config';

describe('OpenSearchService (Phase 2 Search Mirror)', () => {
  let service: OpenSearchService;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      indices: {
        exists: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      index: jest.fn(),
      search: jest.fn(),
      bulk: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenSearchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:9200'),
          },
        },
      ],
    }).compile();

    service = module.get<OpenSearchService>(OpenSearchService);
    // Replace internal client with mock for unit test
    (service as any).client = mockClient;
  });

  describe('ensureIndicesExist', () => {
    it('should create ctp-iocs and ctp-cves indices if they do not exist', async () => {
      mockClient.indices.exists.mockResolvedValue({ body: false });

      await service.ensureIndicesExist();

      expect(mockClient.indices.create).toHaveBeenCalledWith(
        expect.objectContaining({ index: 'ctp-iocs' }),
      );
      expect(mockClient.indices.create).toHaveBeenCalledWith(
        expect.objectContaining({ index: 'ctp-cves' }),
      );
    });
  });

  describe('indexIoc & indexCve', () => {
    it('should index an IOC document correctly', async () => {
      mockClient.index.mockResolvedValue({});
      const ioc = {
        id: 'ioc-1',
        type: 'IP',
        value: '192.0.2.1',
        source: 'AlienVault OTX',
        tags: ['botnet'],
        firstSeen: new Date(),
        lastSeen: new Date(),
        createdAt: new Date(),
      };

      await service.indexIoc(ioc);

      expect(mockClient.index).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'ctp-iocs',
          id: 'ioc-1',
          body: expect.objectContaining({ value: '192.0.2.1' }),
        }),
      );
    });

    it('should index a CVE document correctly', async () => {
      mockClient.index.mockResolvedValue({});
      const cve = {
        id: 'cve-1',
        cveId: 'CVE-2024-3094',
        description: 'XZ Utils backdoor',
        cvssScore: 10.0,
        source: 'NVD',
        publishedDate: new Date(),
        lastModifiedDate: new Date(),
        createdAt: new Date(),
      };

      await service.indexCve(cve);

      expect(mockClient.index).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'ctp-cves',
          id: 'cve-1',
          body: expect.objectContaining({ cveId: 'CVE-2024-3094' }),
        }),
      );
    });
  });

  describe('searchIocs & searchCves', () => {
    it('should query OpenSearch ctp-iocs index and format paginated results', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: {
            total: 1,
            hits: [
              {
                _source: {
                  id: 'ioc-1',
                  type: 'IP',
                  value: '198.51.100.45',
                  source: 'AlienVault OTX',
                },
              },
            ],
          },
        },
      });

      const result = await service.searchIocs('198.51.100.45', 1, 20);

      expect(result.total).toBe(1);
      expect(result.data.length).toBe(1);
      expect(result.data[0].value).toBe('198.51.100.45');
    });
  });

  describe('reindexAll', () => {
    it('should wipe indices and perform bulk reindex from Postgres records', async () => {
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.indices.delete.mockResolvedValue({});
      mockClient.bulk.mockResolvedValue({});

      const iocs = [{ id: 'ioc-1', type: 'IP', value: '10.0.0.1', source: 'OTX' }];
      const cves = [{ id: 'cve-1', cveId: 'CVE-2024-1234', description: 'Test', source: 'NVD' }];

      const result = await service.reindexAll(iocs, cves);

      expect(result.status).toBe('SUCCESS');
      expect(result.iocsReindexed).toBe(1);
      expect(result.cvesReindexed).toBe(1);
      expect(mockClient.indices.delete).toHaveBeenCalledTimes(2);
      expect(mockClient.bulk).toHaveBeenCalledTimes(2);
    });
  });
});
