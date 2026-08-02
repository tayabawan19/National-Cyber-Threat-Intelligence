import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CasesModule } from './cases/cases.module';
import { AlertsModule } from './alerts/alerts.module';
import { IocsModule } from './iocs/iocs.module';
import { AuditModule } from './audit/audit.module';
import { OpenSearchModule } from './opensearch/opensearch.module';
import { ThreatFeedsModule } from './threat-feeds/threat-feeds.module';
import { CvesModule } from './cves/cves.module';
import { LlmModule } from './llm/llm.module';
import { DetectionEngineModule } from './detection-engine/detection-engine.module';
import { DetectionRulesModule } from './detection-rules/detection-rules.module';
import { MalwareModule } from './malware/malware.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CasesModule,
    AlertsModule,
    IocsModule,
    AuditModule,
    OpenSearchModule,
    ThreatFeedsModule,
    CvesModule,
    LlmModule,
    DetectionEngineModule,
    DetectionRulesModule,
    MalwareModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
