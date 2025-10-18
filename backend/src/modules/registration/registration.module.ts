import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationResolver } from './registration.resolver';
import { QRCodeService } from '../../services/qr-code.service';
import { BadgeService } from '../../services/badge.service';
import { DistributedLockService } from '../../services/distributed-lock.service';
import { CapacityCounterService } from '../../services/capacity-counter.service';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  providers: [
    RegistrationService,
    RegistrationResolver,
    QRCodeService,
    BadgeService,
    DistributedLockService,
    CapacityCounterService,
  ],
  exports: [
    RegistrationService,
    QRCodeService,
    BadgeService,
    DistributedLockService,
    CapacityCounterService,
  ],
})
export class RegistrationModule {}
