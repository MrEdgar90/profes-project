import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SchoolService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createSchoolDto: CreateSchoolDto) {
    const school = await this.prisma.school.create({
      data: {
        name: createSchoolDto.name.replaceAll(' ', '+'),
      },
    });

    return school;
  }

  findAll() {
    return this.prisma.school.findMany({});
  }

  async findOne(id: string) {
    try {
      const school = await this.prisma.school.findUnique({
        where: {
          id: id,
        },
      });

      if (!school) {
        throw new NotFoundException('School not found');
      }

      return school;
    } catch (error) {
      throw new Error('School not found');
    }
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto) {
    await this.findOne(id);

    const updatedSchool = await this.prisma.school.update({
      where: {
        id,
      },
      data: updateSchoolDto,
    });

    return updatedSchool;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.school.delete({
      where: {
        id,
      },
    });

    return 'School deleted successfully';
  }
}
