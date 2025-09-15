import { Resolver, Query, Mutation, Args, ID, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from '../events/entities/category.entity';
import { CreateStandaloneCategoryInput } from './dto/create-category.dto';
import { UpdateCategoryInput } from './dto/update-category.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@ObjectType()
class DeleteCategoryResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;
}

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Mutation(() => Category)
  @UseGuards(GqlAuthGuard)
  createCategory(@Args('input') createCategoryInput: CreateStandaloneCategoryInput) {
    return this.categoriesService.create(createCategoryInput);
  }

  @Query(() => [Category], { name: 'categories' })
  @UseGuards(GqlAuthGuard)
  findAll() {
    return this.categoriesService.findAll();
  }

  @Query(() => [Category], { name: 'categoriesByEvent' })
  @UseGuards(GqlAuthGuard)
  findByEventId(@Args('eventId', { type: () => ID }) eventId: string) {
    return this.categoriesService.findByEventId(eventId);
  }

  @Query(() => [Category], { name: 'activeCategories' })
  findActiveCategories() {
    return this.categoriesService.getActiveCategories();
  }

  @Query(() => [Category], { name: 'activeCategoriesByEvent' })
  findActiveCategoriesByEvent(@Args('eventId', { type: () => ID }) eventId: string) {
    return this.categoriesService.findActiveByEventId(eventId);
  }

  @Query(() => Category, { name: 'category' })
  @UseGuards(GqlAuthGuard)
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Mutation(() => Category)
  @UseGuards(GqlAuthGuard)
  updateCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateCategoryInput: UpdateCategoryInput,
  ) {
    return this.categoriesService.update(id, updateCategoryInput);
  }

  @Mutation(() => DeleteCategoryResponse)
  @UseGuards(GqlAuthGuard)
  deleteCategory(@Args('id', { type: () => ID }) id: string) {
    return this.categoriesService.remove(id);
  }

  @Mutation(() => Category)
  @UseGuards(GqlAuthGuard)
  toggleCategoryStatus(@Args('id', { type: () => ID }) id: string) {
    return this.categoriesService.toggleStatus(id);
  }
}
