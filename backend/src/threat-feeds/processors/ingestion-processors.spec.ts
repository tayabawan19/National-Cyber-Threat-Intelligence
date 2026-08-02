import { Test, TestingModule } from '@nestjs/testing';
import { OtxProcessorService } from './otx.processor';
import { NvdProcessorService } from './nvd.processor';
import { AbuseChProcessorService } from './abusech.processor';
import { ThreatIngestionProcessor } from './threat-ingestion.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenSearchService } from '../../opensearch/opensearch.service';
import { DetectionEngineService } from '../../detection-engine/detection-engine.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('Ingestion Processors (Phase 2 OTX, NVD, abuse.ch background jobs)', () => {
  let otxProcessor: OtxProcessorService;
  let nvdProcessor: NvdProcessorService;
  let abuseChProcessor: AbuseChProcessorService;
  let prismaService: any;
  let openSearchService: any;
  let detectionEngineService: any;
  let httpService: any;

  beforeEach(async () => {
    prismaService = {
      feedSyncLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-101' }),
        update: jest.fn().mockResolvedValue({}),
      },
      threatFeed: {
        update: jest.fn().mockResolvedValue({}),
      },
      ioc: {
        upsert: jest.fn().mockResolvedValue({ id: 'ioc-1', value: '198.51.100.45' }),
      },
      cve: {
        upsert: jest.fn().mockResolvedValue({ id: 'cve-1', cveId: 'CVE-2024-3094' }),
      },
    };

    openSearchService = {
      indexIoc: jest.fn().mockResolvedValue({}),
      indexCve: jest.fn().mockResolvedValue({}),
    };

    detectionEngineService = {
      evaluateIoc: jest.fn().mockResolvedValue([]),
      evaluateCve: jest.fn().mockResolvedValue([]),
    };

    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtxProcessorService,
        NvdProcessorService,
        AbuseChProcessorService,
        ThreatIngestionProcessor,
        { provide: PrismaService, useValue: prismaService },
        { provide: OpenSearchService, useValue: openSearchService },
        { provide: DetectionEngineService, useValue: detectionEngineService },
        { provide: HttpService, useValue: httpService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OTX_API_KEY') return 'mock_otx_key';
              if (key === 'NVD_API_KEY') return 'mock_nvd_key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    otxProcessor = module.get<OtxProcessorService>(OtxProcessorService);
    nvdProcessor = module.get<NvdProcessorService>(NvdProcessorService);
    abuseChProcessor = module.get<AbuseChProcessorService>(AbuseChProcessorService);
  });

  it('should instantiate all 3 ingestion processor services', () => {
    expect(otxProcessor).toBeDefined();
    expect(nvdProcessor).toBeDefined();
    expect(abuseChProcessor).toBeDefined();
  });
});
