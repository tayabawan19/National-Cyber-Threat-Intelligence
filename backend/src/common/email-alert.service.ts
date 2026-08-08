import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class EmailAlertService {
  private readonly logger = new Logger(EmailAlertService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async sendCriticalAlertEmail(alert: any): Promise<{ sent: boolean; recipientCount: number; message: string }> {
    const smtpUser = this.configService.get<string>('BREVO_SMTP_USER');
    const smtpKey = this.configService.get<string>('BREVO_SMTP_KEY');
    const smtpHost = this.configService.get<string>('BREVO_SMTP_HOST') || 'smtp-relay.brevo.com';
    const smtpPort = parseInt(this.configService.get<string>('BREVO_SMTP_PORT') || '587', 10);

    if (!smtpKey || smtpKey === 'your_brevo_smtp_key_here') {
      this.logger.warn('[EMAIL ALERT] BREVO_SMTP_KEY not configured. Skipping email dispatch.');
      return { sent: false, recipientCount: 0, message: 'SMTP/API credentials not configured' };
    }

    try {
      // Fetch target recipients (ADMIN & INVESTIGATOR users)
      const recipients = await this.prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'INVESTIGATOR'] } },
        select: { email: true },
      });

      const recipientEmails = Array.from(
        new Set([...recipients.map((r) => r.email).filter(Boolean), smtpUser].filter(Boolean)),
      );

      if (recipientEmails.length === 0) {
        return { sent: false, recipientCount: 0, message: 'No eligible recipients found' };
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #0b1120; color: #f8fafc; padding: 24px; border-radius: 8px;">
          <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #ef4444; margin: 0;">🚨 CRITICAL THREAT ALERT DISPATCH</h2>
            <span style="font-size: 12px; color: #94a3b8;">National Cyber Threat Intelligence Platform</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #94a3b8;">Alert Description:</td>
              <td style="padding: 8px; color: #f8fafc;">${alert.description}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #94a3b8;">Severity:</td>
              <td style="padding: 8px;"><span style="background-color: #ef4444; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${alert.severity}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #94a3b8;">Source Feed:</td>
              <td style="padding: 8px; color: #38bdf8;">${alert.source || 'Threat Engine'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #94a3b8;">Threat Score:</td>
              <td style="padding: 8px; color: #facc15; font-weight: bold;">${alert.score || '8.5'}/10.0</td>
            </tr>
          </table>

          ${
            alert.llmExplanation
              ? `
          <div style="background-color: #1e293b; border-left: 4px solid #38bdf8; padding: 12px; margin-bottom: 16px;">
            <h4 style="color: #38bdf8; margin: 0 0 8px 0;">🤖 AI Groq Advisory Summary</h4>
            <p style="margin: 0; font-size: 14px; color: #cbd5e1;">${alert.llmExplanation}</p>
          </div>
          `
              : ''
          }

          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #334155; text-align: center;">
            <a href="http://localhost:5173" style="background-color: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Triage Alert in SOC Shell</a>
          </div>
        </div>
      `;

      // 1. If key starts with xkeysib-, use Brevo API v3 REST endpoint
      if (smtpKey.startsWith('xkeysib-')) {
        const brevoPayload = {
          sender: { name: 'National Cyber Threat Intel', email: 'admin@cyberintel.gov' },
          to: recipientEmails.map((email) => ({ email })),
          subject: `[CRITICAL ALERT] ${alert.description}`,
          htmlContent,
        };

        const res = await axios.post('https://api.brevo.com/v3/smtp/email', brevoPayload, {
          headers: {
            'api-key': smtpKey,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        });

        const messageId = res.data?.messageId || 'brevo-api-success';
        this.logger.log(`[EMAIL ALERT] Brevo API v3 email sent successfully to ${recipientEmails.length} recipients (Message ID: ${messageId})`);
        return { sent: true, recipientCount: recipientEmails.length, message: `Sent via Brevo API v3 (Message ID: ${messageId})` };
      }

      // 2. Standard Nodemailer SMTP Transport
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser || 'admin@cyberintel.gov',
          pass: smtpKey,
        },
      });

      const info = await transporter.sendMail({
        from: `"National Cyber Threat Intel" <${smtpUser || 'admin@cyberintel.gov'}>`,
        to: recipientEmails.join(', '),
        subject: `[CRITICAL ALERT] ${alert.description}`,
        html: htmlContent,
      });

      this.logger.log(`[EMAIL ALERT] Brevo SMTP email sent successfully to ${recipientEmails.length} recipients (Message ID: ${info.messageId})`);
      return { sent: true, recipientCount: recipientEmails.length, message: `Sent via Brevo SMTP (ID: ${info.messageId})` };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      this.logger.error(`[EMAIL ALERT] Failed to send Brevo email: ${errMsg}`, err.stack);
      return { sent: false, recipientCount: 0, message: `Brevo error: ${errMsg}` };
    }
  }
}
