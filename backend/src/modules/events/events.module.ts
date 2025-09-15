import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsResolver, CategoriesResolver } from './events.resolver';
import { EventStaffService } from './event-staff.service';
import { EventStaffResolver } from './event-staff.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [EventsService, EventsResolver, CategoriesResolver, EventStaffService, EventStaffResolver, PrismaService],
  exports: [EventsService, EventStaffService],
})
export class EventsModule {}
