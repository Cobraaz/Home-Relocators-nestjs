import { CacheModule, Global, Module } from '@nestjs/common';
import { CachingService } from './caching.service';

@Global()
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
  ],
  providers: [CachingService],
})
export class CachingModule {}
