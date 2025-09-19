import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { webcrypto } from 'crypto';

// Fix for @nestjs/schedule crypto issue in Node.js 18
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get configuration service
  const configService = app.get(ConfigService);
  
  // Enable CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });
  
  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        console.log('=== Validation Errors ===');
        console.log(JSON.stringify(errors, null, 2));
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    }),
  );
  
  // Get port from environment
  const port = configService.get('PORT', 3001);
  
  await app.listen(port);
  
  console.log(`🚀 Event Registration API is running on: http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap();
