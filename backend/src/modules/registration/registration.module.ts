import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationResolver } from './registration.resolver';
import { QRCodeService } from '../../services/qr-code.service';
import { BadgeService } from '../../services/badge.service';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  providers: [RegistrationService, RegistrationResolver, QRCodeService, BadgeService],
  exports: [RegistrationService, QRCodeService, BadgeService],
})
export class RegistrationModule {}
