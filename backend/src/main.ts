import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend client
  app.enableCors({
    origin: true,
    credentials: true,
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
    .setDescription('Phase 1 Foundation REST API for SOC Analysts, Threat Detection & Incident Response.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication, JWT issuance, and session status')
    .addTag('Users', 'User management and role administration')
    .addTag('Cases', 'Security incident case management')
    .addTag('Alerts', 'Security alert triage and case linking')
    .addTag('IOCs', 'Indicators of Compromise data models')
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
