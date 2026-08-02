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
}
