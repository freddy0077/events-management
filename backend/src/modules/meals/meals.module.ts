import { Module } from '@nestjs/common';
import { MealsService } from './meals.service';
import { MealsResolver, MealAttendanceResolver } from './meals.resolver';
import { QRCodeService } from '../../services/qr-code.service';

@Module({
  providers: [MealsService, MealsResolver, MealAttendanceResolver, QRCodeService],
  exports: [MealsService],
})
export class MealsModule {}
