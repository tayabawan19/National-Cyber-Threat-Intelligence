import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Configurable CORS restriction for production security
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Global prefix for all API endpoints
  app.setGlobalPrefix('api');

  // Global Validation Pipe for DTO enforcement & transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger / OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('National Cyber Threat Intelligence Platform API')
    .setDescription('Enterprise Cyber Threat Intelligence, Incident Response & Threat Hunting REST API.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication, JWT issuance, and session status')
    .addTag('Users', 'User management and role administration')
    .addTag('Cases', 'Security incident case management')
    .addTag('Alerts', 'Security alert triage, correlation & case linking')
    .addTag('IOCs', 'Indicators of Compromise search & intelligence management')
    .addTag('Detection Rules', 'SIEM & Detection Engine rules management')
    .addTag('Malware', 'Malware Bazaar samples, hashes & sandbox analysis')
    .addTag('CVEs', 'NVD Vulnerability Database & CVE intelligence')
    .addTag('Threat Feeds', 'External threat feed integration & MISP sync status')
    .addTag('Forensics', 'Digital forensic evidence & Chain of Custody tracking')
    .addTag('SIEM', 'Log ingestion & SIEM alert export integration')
    .addTag('Audit Logs', 'System mutation logs for compliance & auditing')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🚀 Threat Intel Backend API listening on port ${port}`);
  logger.log(`📚 Swagger Documentation served at http://localhost:${port}/api/docs`);
  logger.log(`=======================================================`);
}

bootstrap();
