import { Test, TestingModule } from '@nestjs/testing';
import { ThreatFeedsService, THREAT_INGESTION_QUEUE } from './threat-feeds.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenSearchService } from '../opensearch/opensearch.service';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';

describe('ThreatFeedsService (Phase 2 Feed Management & BullMQ Queue)', () => {
  let service: ThreatFeedsService;
  let prismaService: any;
  let openSearchService: any;
  let mockQueue: any;

  const mockFeed = {
    id: 'feed-otx-1',
    name: 'AlienVault OTX',
    type: 'REPUTATION',
    baseUrl: 'https://otx.alienvault.com/api/v1',
    enabled: true,
    lastSyncedAt: new Date(),
  };

  beforeEach(async () => {
    prismaService = {
      threatFeed: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      ioc: { findMany: jest.fn().mockResolvedValue([{ id: 'ioc-1' }]) },
      cve: { findMany: jest.fn().mockResolvedValue([{ id: 'cve-1' }]) },
    };

    openSearchService = {
      reindexAll: jest.fn().mockResolvedValue({ iocsReindexed: 1, cvesReindexed: 1, status: 'SUCCESS' }),
    };

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-101' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThreatFeedsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: OpenSearchService, useValue: openSearchService },
        { provide: getQueueToken(THREAT_INGESTION_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ThreatFeedsService>(ThreatFeedsService);
  });

  describe('triggerSync', () => {
    it('should add OTX ingestion job to BullMQ queue when OTX feed is triggered', async () => {
      prismaService.threatFeed.findUnique.mockResolvedValue(mockFeed);

      const result = await service.triggerSync('feed-otx-1');

      expect(mockQueue.add).toHaveBeenCalledWith(
        'sync-otx',
        { feedId: mockFeed.id, feedName: mockFeed.name },
        expect.any(Object),
      );
      expect(result.jobId).toBe('job-101');
      expect(result.status).toBe('ENQUEUED');
    });

    it('should throw NotFoundException if threat feed ID does not exist', async () => {
      prismaService.threatFeed.findUnique.mockResolvedValue(null);

      await expect(service.triggerSync('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw Error if feed is disabled', async () => {
      prismaService.threatFeed.findUnique.mockResolvedValue({ ...mockFeed, enabled: false });

      await expect(service.triggerSync('feed-otx-1')).rejects.toThrow();
    });
  });

  describe('reindexSearchMirror', () => {
    it('should query Postgres iocs/cves and trigger OpenSearch reindexing', async () => {
      const result = await service.reindexSearchMirror();

      expect(prismaService.ioc.findMany).toHaveBeenCalled();
      expect(prismaService.cve.findMany).toHaveBeenCalled();
      expect(openSearchService.reindexAll).toHaveBeenCalled();
      expect(result.status).toBe('SUCCESS');
    });
  });
});
