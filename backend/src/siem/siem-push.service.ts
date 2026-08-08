import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SiemPushResponse {
  splunkStatus: string;
  splunkResponseBody?: any;
  wazuhStatus: string;
  wazuhResponseBody?: any;
}

@Injectable()
export class SiemPushService {
  private readonly logger = new Logger(SiemPushService.name);

  constructor(private configService: ConfigService) {}

  async pushAlertToSiem(alert: any): Promise<SiemPushResponse> {
    const splunkUrl = this.configService.get<string>('SPLUNK_HEC_URL') || 'http://localhost:8088';
    const splunkToken = this.configService.get<string>('SPLUNK_HEC_TOKEN') || 'splunk_hec_secret_token_2026';
    const wazuhUrl = this.configService.get<string>('WAZUH_API_URL') || 'http://localhost:55000';
    const wazuhApiKey = this.configService.get<string>('WAZUH_API_KEY') || 'wazuh_api_key_secret_2026';

    let splunkStatus = 'SKIPPED';
    let splunkResponseBody = null;
    let wazuhStatus = 'SKIPPED';
    let wazuhResponseBody = null;

    // 1. Push to Splunk HEC
    try {
      const splunkPayload = {
        time: Math.floor(new Date(alert.createdAt || Date.now()).getTime() / 1000),
        host: 'ctp-platform',
        source: alert.source || 'cyber-threat-platform',
        sourcetype: 'threat:alert',
        event: {
          id: alert.id,
          description: alert.description,
          severity: alert.severity,
          score: alert.score,
          status: alert.status,
          occurrenceCount: alert.occurrenceCount,
          sourceIoc: alert.sourceIoc?.value || null,
          sourceCve: alert.sourceCve?.cveId || null,
          sourceMalware: alert.sourceMalware?.hashSha256 || null,
          llmSuggestedSeverity: alert.llmSuggestedSeverity || null,
        },
      };

      const res = await axios.post(`${splunkUrl.replace(/\/$/, '')}/services/collector/event`, splunkPayload, {
        headers: {
          Authorization: `Splunk ${splunkToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 3000,
      });
      splunkStatus = `HTTP ${res.status} OK`;
      splunkResponseBody = res.data;
      this.logger.log(`[SIEM PUSH - SPLUNK] Successfully pushed Alert #${alert.id} to Splunk HEC (HTTP ${res.status})`);
    } catch (err: any) {
      splunkStatus = `FAILED (${err.response?.status || err.code || err.message})`;
      splunkResponseBody = err.response?.data || null;
      this.logger.warn(`[SIEM PUSH - SPLUNK] Could not push Alert #${alert.id} to Splunk HEC: ${err.message}`);
    }

    // 2. Push to Wazuh Manager API
    try {
      const wazuhPayload = {
        alert_id: alert.id,
        rule_id: alert.ruleId || 'CTP-AUTOMATED-001',
        description: alert.description,
        severity: alert.severity,
        score: alert.score,
        agent: { id: '000', name: 'CTP-SOC-Node' },
        timestamp: new Date().toISOString(),
        details: {
          source: alert.source,
          occurrenceCount: alert.occurrenceCount,
        },
      };

      const res = await axios.post(`${wazuhUrl.replace(/\/$/, '')}/api/v1/alerts`, wazuhPayload, {
        headers: {
          'x-wazuh-key': wazuhApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 3000,
      });
      wazuhStatus = `HTTP ${res.status} OK`;
      wazuhResponseBody = res.data;
      this.logger.log(`[SIEM PUSH - WAZUH] Successfully pushed Alert #${alert.id} to Wazuh Manager (HTTP ${res.status})`);
    } catch (err: any) {
      wazuhStatus = `FAILED (${err.response?.status || err.code || err.message})`;
      wazuhResponseBody = err.response?.data || null;
      this.logger.warn(`[SIEM PUSH - WAZUH] Could not push Alert #${alert.id} to Wazuh Manager: ${err.message}`);
    }

    return { splunkStatus, splunkResponseBody, wazuhStatus, wazuhResponseBody };
  }
}
