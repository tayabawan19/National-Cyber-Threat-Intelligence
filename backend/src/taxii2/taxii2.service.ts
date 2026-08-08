import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Taxii2Service {
  constructor(private prisma: PrismaService) {}

  getDiscovery() {
    return {
      title: 'National Cyber Threat Intelligence TAXII 2.1 Server',
      description: 'Enterprise TAXII 2.1 Server delivering normalized STIX 2.1 Cyber Threat Intelligence (SDO)',
      default: 'http://localhost:3000/api/taxii2/collections/',
      api_roots: ['http://localhost:3000/api/taxii2/'],
    };
  }

  getCollections() {
    return {
      collections: [
        {
          id: 'ctp-indicators',
          title: 'CTP STIX 2.1 Threat Indicators',
          description: 'Normalized IP, Domain, Hash, and URL IOC SDO objects',
          can_read: true,
          can_write: false,
          media_types: ['application/stix+json;version=2.1'],
        },
        {
          id: 'ctp-malware',
          title: 'CTP STIX 2.1 Malware SDOs',
          description: 'Normalized Malware sample and family metadata SDO objects',
          can_read: true,
          can_write: false,
          media_types: ['application/stix+json;version=2.1'],
        },
        {
          id: 'ctp-cves',
          title: 'CTP STIX 2.1 Vulnerability SDOs',
          description: 'Normalized NVD CVE Vulnerability SDO objects',
          can_read: true,
          can_write: false,
          media_types: ['application/stix+json;version=2.1'],
        },
      ],
    };
  }

  async getCollectionObjects(collectionId: string) {
    if (collectionId === 'ctp-indicators') {
      const iocs = await this.prisma.ioc.findMany({ take: 50, orderBy: { lastSeen: 'desc' } });
      const stixObjects = iocs.map((ioc) => this.convertToStixIndicator(ioc));
      return this.wrapStixBundle(stixObjects);
    }

    if (collectionId === 'ctp-malware') {
      const samples = await this.prisma.malwareSample.findMany({ take: 50, orderBy: { lastSeen: 'desc' } });
      const stixObjects = samples.map((m) => this.convertToStixMalware(m));
      return this.wrapStixBundle(stixObjects);
    }

    if (collectionId === 'ctp-cves') {
      const cves = await this.prisma.cve.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
      const stixObjects = cves.map((cve) => this.convertToStixVulnerability(cve));
      return this.wrapStixBundle(stixObjects);
    }

    throw new NotFoundException(`TAXII 2.1 collection with ID '${collectionId}' not found`);
  }

  private convertToStixIndicator(ioc: any) {
    let pattern = `[domain-name:value = '${ioc.value}']`;
    if (ioc.type === 'IP') pattern = `[ipv4-addr:value = '${ioc.value}']`;
    if (ioc.type === 'HASH') pattern = `[file:hashes.'SHA-256' = '${ioc.value}']`;
    if (ioc.type === 'URL') pattern = `[url:value = '${ioc.value}']`;

    return {
      type: 'indicator',
      spec_version: '2.1',
      id: `indicator--${ioc.id}`,
      created: ioc.createdAt.toISOString(),
      modified: ioc.updatedAt.toISOString(),
      name: `IOC Indicator (${ioc.type}: ${ioc.value})`,
      description: `Threat indicator gathered from ${ioc.source}`,
      pattern,
      pattern_type: 'stix',
      valid_from: ioc.firstSeen.toISOString(),
      labels: ioc.tags || ['malicious-activity'],
      confidence: 85,
    };
  }

  private convertToStixMalware(malware: any) {
    return {
      type: 'malware',
      spec_version: '2.1',
      id: `malware--${malware.id}`,
      created: malware.createdAt.toISOString(),
      modified: malware.updatedAt.toISOString(),
      name: malware.name,
      malware_types: [malware.malwareFamily?.toLowerCase() || 'trojan'],
      is_family: Boolean(malware.malwareFamily),
      description: `Malware sample SHA256: ${malware.hashSha256}`,
      labels: malware.tags || ['ransomware'],
    };
  }

  private convertToStixVulnerability(cve: any) {
    return {
      type: 'vulnerability',
      spec_version: '2.1',
      id: `vulnerability--${cve.id}`,
      created: cve.createdAt.toISOString(),
      modified: cve.updatedAt.toISOString(),
      name: cve.cveId,
      description: cve.description || `NVD Vulnerability ${cve.cveId}`,
      external_references: [
        {
          source_name: 'cve',
          external_id: cve.cveId,
          url: `https://nvd.nist.gov/vuln/detail/${cve.cveId}`,
        },
      ],
    };
  }

  private wrapStixBundle(objects: any[]) {
    return {
      type: 'bundle',
      spec_version: '2.1',
      id: `bundle--${Date.now()}`,
      objects,
    };
  }
}
