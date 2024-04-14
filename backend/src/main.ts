import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getPublicDir, startDevServer } from '@virgile/frontend';
import { AppModule } from './app.module';

import { urlencoded } from 'body-parser';
import RedisStore from 'connect-redis';
import session from 'express-session';
import Redis from 'ioredis';
import passport from 'passport';
import { HttpExceptionFilter } from './auth/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  await startDevServer(app);

  // Initialize client
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"
  const redisClient = new Redis(redisUrl, {

  });
  redisClient.connect().catch(console.error)

  // Initialize store
  const redisStore = new RedisStore({
    client: redisClient,
    ttl: 86400 * 30
  })

  app.set('trust proxy', 1)

  app.use(
    session({
      store: redisStore,
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: process.env.SESSION_SECRET || '123',
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        secure: false
      }
    }),
  )

  app.useStaticAssets(getPublicDir(), {
    immutable: true,
    maxAge: '1y',
    index: false,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(passport.initialize())
  app.use(passport.session())
  app.use("/authenticate", urlencoded({ extended: true })) // Add this line
  app.use("/auth/logout", urlencoded({ extended: true })) // Add this line

  const selectedPort = process.env.PORT ?? 3000;

  console.log(`Running on port http://localhost:${selectedPort}`);
  await app.listen(selectedPort);
}
bootstrap();
