import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { ForensicsModule } from './forensics/forensics.module';
import { SiemModule } from './siem/siem.module';
import { PlaybooksModule } from './playbooks/playbooks.module';
import { Taxii2Module } from './taxii2/taxii2.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 20,
    }, {
      name: 'medium',
      ttl: 60000,
      limit: 100,
    }]),
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
    ForensicsModule,
    SiemModule,
    PlaybooksModule,
    Taxii2Module,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
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
