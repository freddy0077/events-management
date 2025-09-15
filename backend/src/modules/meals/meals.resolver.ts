import { Resolver, Query, Mutation, Args, ID, Context, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MealsService } from './meals.service';
import { Meal } from './entities/meal.entity';
import { MealAttendance } from './entities/meal-attendance.entity';
import { CreateMealInput, UpdateMealInput, ScanQRCodeInput, ScanResult, CateringMetrics, ServeMealInput, ServeMealResult, CateringReports, CateringReportsFilter, ValidateQRCodeInput, QRCodeValidationResponse, MealSessionActionResult, FailedScanInput, FailedScanResult } from './dto/meal.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Registration } from '../registration/entities/registration.entity';
import { Audit } from '../../decorators/audit.decorator';

@Resolver(() => Meal)
export class MealsResolver {
  constructor(private mealsService: MealsService) {}

  @Mutation(() => Meal)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'MEAL_SESSION_CREATED', 
    resourceType: 'meal',
    description: 'User created a new meal session',
    includeRequest: true 
  })
  async createMeal(@Args('input') createMealInput: CreateMealInput): Promise<Meal> {
    return this.mealsService.createMeal(createMealInput);
  }

  @Query(() => [Meal])
  @UseGuards(GqlAuthGuard)
  async mealsByEvent(@Args('eventId', { type: () => ID }) eventId: string): Promise<Meal[]> {
    return this.mealsService.findMealsByEvent(eventId);
  }

  @Query(() => [Meal])
  @UseGuards(GqlAuthGuard)
  async activeMeals(): Promise<Meal[]> {
    return this.mealsService.findActiveMeals();
  }

  @Query(() => Meal)
  @UseGuards(GqlAuthGuard)
  async meal(@Args('id', { type: () => ID }) id: string): Promise<Meal> {
    return this.mealsService.findMealById(id);
  }

  @Mutation(() => Meal)
  @UseGuards(GqlAuthGuard)
  async updateMeal(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateMealInput: UpdateMealInput,
  ): Promise<Meal> {
    return this.mealsService.updateMeal(id, updateMealInput);
  }

  @Mutation(() => ScanResult)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'QR_SCANNED', 
    resourceType: 'meal',
    description: 'User scanned QR code for meal attendance',
    includeRequest: true 
  })
  async scanMealQRCode(
    @Args('input') scanInput: ScanQRCodeInput,
    @Context() context: any,
  ): Promise<ScanResult> {
    const scannedBy = context.req.user.id;
    return this.mealsService.scanQRCode(scanInput, scannedBy);
  }

  @Mutation(() => QRCodeValidationResponse)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'QR_VALIDATED', 
    resourceType: 'meal',
    description: 'User validated QR code for meal eligibility',
    includeRequest: true 
  })
  async validateQRCode(
    @Args('input') validateInput: ValidateQRCodeInput,
    @Context() context: any,
  ): Promise<QRCodeValidationResponse> {
    return this.mealsService.validateQRCode(validateInput);
  }

  @Mutation(() => FailedScanResult)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'QR_SCAN_FAILED', 
    resourceType: 'meal',
    description: 'User recorded a failed QR code scan attempt',
    includeRequest: true 
  })
  async recordFailedScan(
    @Args('input') failedScanInput: FailedScanInput,
    @Context() context: any,
  ): Promise<FailedScanResult> {
    const scannedBy = context.req.user.id;
    return this.mealsService.recordFailedScan(failedScanInput, scannedBy);
  }

  @Query(() => [MealAttendance])
  @UseGuards(GqlAuthGuard)
  async mealAttendance(@Args('mealId', { type: () => ID }) mealId: string): Promise<MealAttendance[]> {
    return this.mealsService.getMealAttendance(mealId);
  }

  @Query(() => [MealAttendance])
  @UseGuards(GqlAuthGuard)
  async recentMealAttendances(
    @Args('eventId', { type: () => ID, nullable: true }) eventId?: string,
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 50 }) limit?: number,
  ): Promise<MealAttendance[]> {
    return this.mealsService.getRecentMealAttendances(eventId, limit);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteMeal(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.mealsService.deleteMeal(id);
  }

  @Query(() => CateringMetrics)
  @UseGuards(GqlAuthGuard)
  async getCateringMetrics(
    @Args('eventId', { type: () => ID, nullable: true }) eventId?: string,
  ): Promise<CateringMetrics> {
    return this.mealsService.getCateringMetrics(eventId);
  }

  @Query(() => [Registration])
  @UseGuards(GqlAuthGuard)
  async getCateringRegistrations(
    @Args('eventId', { type: () => ID, nullable: true }) eventId?: string,
    @Args('mealFilter', { nullable: true }) mealFilter?: string,
    @Args('statusFilter', { nullable: true }) statusFilter?: string,
  ): Promise<Registration[]> {
    return this.mealsService.getCateringRegistrations(eventId, mealFilter, statusFilter);
  }

  @Mutation(() => ServeMealResult)
  @UseGuards(GqlAuthGuard)
  async serveMeal(
    @Args('input') serveMealInput: ServeMealInput,
    @Context() context: any,
  ): Promise<ServeMealResult> {
    const servedBy = context.req.user.id;
    return this.mealsService.serveMeal(serveMealInput, servedBy);
  }

  @Mutation(() => MealSessionActionResult)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'MEAL_SESSION_STARTED', 
    resourceType: 'meal',
    description: 'User started a meal session',
    includeRequest: true 
  })
  async startMealSession(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any,
  ): Promise<MealSessionActionResult> {
    const userId = context.req.user.id;
    return this.mealsService.startMealSession(id, userId);
  }

  @Mutation(() => MealSessionActionResult)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'MEAL_SESSION_ENDED', 
    resourceType: 'meal',
    description: 'User ended a meal session',
    includeRequest: true 
  })
  async endMealSession(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any,
  ): Promise<MealSessionActionResult> {
    const userId = context.req.user.id;
    return this.mealsService.endMealSession(id, userId);
  }

  @Query(() => [Meal])
  @UseGuards(GqlAuthGuard)
  async getMealSessions(
    @Context() context: any,
    @Args('eventId', { type: () => ID, nullable: true }) eventId?: string,
  ): Promise<Meal[]> {
    const userId = context.req.user.id;
    return this.mealsService.getMealSessions(eventId, userId);
  }

  @Query(() => CateringReports)
  @UseGuards(GqlAuthGuard)
  async getCateringReports(
    @Args('filter', { nullable: true }) filter?: CateringReportsFilter,
  ): Promise<CateringReports> {
    return this.mealsService.getCateringReports(filter);
  }

  @ResolveField(() => Number)
  async totalAttendees(@Parent() meal: Meal): Promise<number> {
    return meal.attendances?.length || 0;
  }

  @ResolveField(() => String)
  name(@Parent() meal: Meal): string {
    return meal.sessionName;
  }

  @ResolveField(() => String)
  sessionTime(@Parent() meal: Meal): string {
    const start = new Date(meal.startTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    const end = new Date(meal.endTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    return `${start} - ${end}`;
  }

  @ResolveField(() => String)
  status(@Parent() meal: Meal): string {
    const now = new Date();
    const mealStart = new Date(meal.startTime);
    const mealEnd = new Date(meal.endTime);
    
    // If the meal session has been manually started (isActive = true)
    if (meal.isActive) {
      if (now > mealEnd) {
        return 'completed';
      } else {
        return 'active';
      }
    }
    
    // If the meal session hasn't been started yet (isActive = false)
    if (now > mealEnd) {
      return 'completed';
    } else if (now >= mealStart) {
      return 'scheduled'; // Ready to start but not manually started
    } else {
      return 'scheduled'; // Future meal session
    }
  }
}

@Resolver(() => MealAttendance)
export class MealAttendanceResolver {
  constructor(private mealsService: MealsService) {}

  @ResolveField(() => Meal)
  async meal(@Parent() mealAttendance: MealAttendance): Promise<Meal> {
    return this.mealsService.findMealById(mealAttendance.mealId);
  }
}
