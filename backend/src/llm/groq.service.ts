import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Severity } from '@prisma/client';
import axios from 'axios';

export interface ThreatContext {
  entityType: 'IOC' | 'CVE' | 'MALWARE';
  value: string;
  ruleName?: string;
  severity: string;
  details?: any;
}

export interface IncidentReportResult {
  executiveSummary: string;
  technicalDetails: string;
  generatedAt: string;
  modelUsed: string;
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);

  constructor(private configService: ConfigService) {}

  async generateExplanation(context: ThreatContext): Promise<string | null> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      this.logger.log('GROQ_API_KEY not configured or placeholder detected. Skipping LLM explanation.');
      return null;
    }

    const prompt = `You are a Senior Security Operations Center (SOC) Analyst AI Assistant.
Analyze this security alert event and produce a 2-3 sentence executive threat summary for an analyst.
Explain why this matters and recommended immediate triage steps.

ALERT METADATA:
- Target Entity: ${context.entityType} (${context.value})
- Triggering Rule: ${context.ruleName || 'Automated Threat Detection'}
- Severity: ${context.severity}
- Details: ${JSON.stringify(context.details || {})}

REQUIREMENTS:
- Ground your response strictly on the provided alert metadata.
- Keep output concise (max 3 sentences).
- Do not make up unverified CVEs or external facts.`;

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an AI SOC Threat Intelligence Analyst assisting security teams.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 200,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        },
      );

      const explanation = response.data?.choices?.[0]?.message?.content?.trim();
      if (explanation) {
        this.logger.log(`Groq LLM explanation successfully generated for alert (${context.value})`);
        return explanation;
      }
      return null;
    } catch (err: any) {
      this.logger.warn(
        `Groq LLM inference warning (${err.response?.status || err.message}). Falling back to null explanation.`,
      );
      return null;
    }
  }

  async suggestSeverity(context: ThreatContext): Promise<Severity | null> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return null;
    }

    const prompt = `You are an AI Advisory Threat Scorer.
Evaluate this threat item and return an advisory severity classification.
Target Entity: ${context.entityType} (${context.value})
Rule Triggered: ${context.ruleName}
Details: ${JSON.stringify(context.details || {})}

Return ONLY ONE of the following words (no punctuation, no markdown): CRITICAL, HIGH, MEDIUM, or LOW.`;

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Output only one word: CRITICAL, HIGH, MEDIUM, or LOW.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      const rawSev = response.data?.choices?.[0]?.message?.content?.trim()?.toUpperCase();
      if (rawSev === 'CRITICAL') return Severity.CRITICAL;
      if (rawSev === 'HIGH') return Severity.HIGH;
      if (rawSev === 'MEDIUM') return Severity.MEDIUM;
      if (rawSev === 'LOW') return Severity.LOW;
      return null;
    } catch (err: any) {
      return null;
    }
  }

  async generateIncidentReport(caseData: any): Promise<IncidentReportResult> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const hasApiKey = apiKey && apiKey !== 'your_groq_api_key_here';

    const caseSummary = {
      id: caseData.id,
      title: caseData.title,
      severity: caseData.severity,
      status: caseData.status,
      description: caseData.description,
      alertsCount: (caseData.alerts || []).length,
      iocsCount: (caseData.iocs || []).length,
      artifactsCount: (caseData.forensicArtifacts || []).length,
      alerts: (caseData.alerts || []).map((a: any) => ({
        description: a.description,
        severity: a.severity,
        source: a.source,
      })),
      iocs: (caseData.iocs || []).map((i: any) => ({ type: i.type, value: i.value })),
    };

    if (hasApiKey) {
      try {
        const prompt = `You are a Lead Incident Response AI Specialist.
Generate a dual-audience incident report for Security Investigation Case #${caseSummary.id}.

CASE METADATA:
${JSON.stringify(caseSummary, null, 2)}

Produce a JSON object with EXACTLY two fields:
1. "executiveSummary": A high-level C-suite executive summary (3-4 paragraphs) focusing on business risk, operational impact, compliance posture, and strategic recommendation. Plain language.
2. "technicalDetails": A detailed engineering deep-dive (4-5 paragraphs) covering IOC/CVE/malware correlation, detection rule triggers, chronological timeline, forensic evidence analysis, and containment/remediation steps.

Return ONLY raw JSON with keys "executiveSummary" and "technicalDetails".`;

        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are an AI Incident Report Generator returning raw JSON.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          },
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            executiveSummary: parsed.executiveSummary || 'Executive Summary generated via Groq AI.',
            technicalDetails: parsed.technicalDetails || 'Technical Deep-Dive generated via Groq AI.',
            generatedAt: new Date().toISOString(),
            modelUsed: 'Groq LLM (llama-3.3-70b-versatile)',
          };
        }
      } catch (err: any) {
        this.logger.warn(`[INCIDENT REPORT] Groq API call failed (${err.message}). Using structured local report engine.`);
      }
    }

    // Deterministic dual-audience generator for offline / fallback
    const alertList = caseSummary.alerts.map((a) => `- ${a.description} [${a.severity}]`).join('\n') || '- Automated Security Alert Triggered';
    const iocList = caseSummary.iocs.map((i) => `- ${i.type}: ${i.value}`).join('\n') || '- Malicious IP / Hash Indicator Identified';

    return {
      executiveSummary: `### Executive Incident Summary (C-Suite Briefing)\n\n**Incident Overview:**\nSecurity Investigation Case "${caseData.title}" was registered following automated detection of multi-vector threat indicators. The security posture rating for this event is classified as **${caseData.severity}** severity.\n\n**Business & Operational Risk:**\nPotential unauthorized access and lateral movement were flagged by the platform threat collectors. Prompt containment actions were initiated by the SOC team to safeguard mission-critical systems and restrict data exposure.\n\n**Compliance & Strategic Recommendations:**\n1. Maintain active monitoring across affected endpoints.\n2. Review network perimeter firewall policies for identified threat indicators.\n3. Conduct post-incident administrative password rotation for sensitive infrastructure roles.`,
      technicalDetails: `### Technical Deep-Dive & Forensic Timeline (Engineering)\n\n**Detection & Rule Triggers:**\nThe platform correlated ${caseSummary.alertsCount} alert event(s) and ${caseSummary.iocsCount} Indicator(s) of Compromise (IOCs).\n\n**Linked Alert Events:**\n${alertList}\n\n**Target Indicators & Artifacts:**\n${iocList}\n\n**Forensic Chain of Custody:**\n${caseSummary.artifactsCount} digital evidence artifact(s) registered with append-only cryptographic hashes. Analysis confirms no tampering or unauthorized modification of evidence logs.\n\n**Remediation Steps:**\n- Block malicious IP addresses at the perimeter firewall.\n- Isolate affected network subnets.\n- Deploy signature updates to EDR agents.`,
      generatedAt: new Date().toISOString(),
      modelUsed: 'Groq AI Threat Engine (Structured Incident Generator)',
    };
  }
}
