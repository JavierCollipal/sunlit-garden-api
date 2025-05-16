import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private health: HealthCheckService,
    private mongo: MongooseHealthIndicator,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @HealthCheck()
  async check() {
    return this.health.check([
      // Check database connection
      async () => this.mongo.pingCheck('database'),
      // Check memory usage
      () => ({
        memory_heap: {
          status: 'up',
          details: process.memoryUsage().heapUsed,
        },
      }),
      // Check uptime
      () => ({
        uptime: {
          status: 'up',
          details: process.uptime(),
        },
      }),
    ]);
  }
}
