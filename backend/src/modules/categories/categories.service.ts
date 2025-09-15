import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStandaloneCategoryInput } from './dto/create-category.dto';
import { UpdateCategoryInput } from './dto/update-category.dto';
import { Category } from '../events/entities/category.entity';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryInput: CreateStandaloneCategoryInput): Promise<Category> {
    const category = await this.prisma.category.create({
      data: {
        eventId: createCategoryInput.eventId,
        name: createCategoryInput.name,
        description: createCategoryInput.description,
        price: new Decimal(createCategoryInput.price),
        maxCapacity: createCategoryInput.maxCapacity,
        isActive: createCategoryInput.isActive ?? true,
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return {
      ...category,
      price: category.price ? parseFloat(category.price.toString()) : 0,
      currentCount: category._count?.registrations || 0,
    };
  }

  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return categories.map(category => ({
      ...category,
      price: category.price ? parseFloat(category.price.toString()) : 0,
      currentCount: category._count?.registrations || 0,
    }));
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return {
      ...category,
      price: category.price ? parseFloat(category.price.toString()) : 0,
      currentCount: category._count?.registrations || 0,
    };
  }

  async update(id: string, updateCategoryInput: UpdateCategoryInput): Promise<Category> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(updateCategoryInput.name && { name: updateCategoryInput.name }),
        ...(updateCategoryInput.description !== undefined && { description: updateCategoryInput.description }),
        ...(updateCategoryInput.price !== undefined && { price: new Decimal(updateCategoryInput.price) }),
        ...(updateCategoryInput.maxCapacity !== undefined && { maxCapacity: updateCategoryInput.maxCapacity }),
        ...(updateCategoryInput.isActive !== undefined && { isActive: updateCategoryInput.isActive }),
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return {
      ...category,
      price: category.price ? parseFloat(category.price.toString()) : 0,
      currentCount: category._count?.registrations || 0,
    };
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category has registrations
    if (existingCategory._count.registrations > 0) {
      throw new BadRequestException(
        `Cannot delete category "${existingCategory.name}" because it has ${existingCategory._count.registrations} registration(s). Please reassign or remove the registrations first.`
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Category "${existingCategory.name}" has been successfully deleted.`,
    };
  }

  async toggleStatus(id: string): Promise<Category> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        isActive: !existingCategory.isActive,
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return {
      ...category,
      price: category.price ? parseFloat(category.price.toString()) : 0,
      currentCount: category._count?.registrations || 0,
    };
  }

  async getActiveCategories(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map(category => ({
      ...category,
      price: category.price ? parseFloat(category.price.toString()) : 0,
      currentCount: category._count?.registrations || 0,
    }));
  }

  async findByEventId(eventId: string): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        eventId,
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return categories.map(category => ({
      ...category,
      price: category.price ? parseFloat(category.price.toString()) : 0,
      currentCount: category._count?.registrations || 0,
    }));
  }

  async findActiveByEventId(eventId: string): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        eventId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map(category => ({
      ...category,
      price: category.price ? parseFloat(category.price.toString()) : 0,
      currentCount: category._count?.registrations || 0,
    }));
  }
}
