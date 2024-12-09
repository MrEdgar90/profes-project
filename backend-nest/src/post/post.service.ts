import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { InternalServerError } from 'openai';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createPostDto: CreatePostDto, userId: string) {
    const { proffessorName, schoolName } = createPostDto;

    const post = await this.prisma.$transaction(async (prisma) => {
      let school = await prisma.school.findFirst({
        where: { name: schoolName.replaceAll(' ', '+').toLowerCase() },
      });

      if (!school) {
        school = await prisma.school.create({
          data: {
            name: schoolName.replaceAll(' ', '+').toLowerCase(),
          },
        });
      }

      // Verificamos si el profesor ya existe
      let professor = await prisma.proffessor.findFirst({
        where: { name: proffessorName.replaceAll(' ', '+').toLowerCase() },
      });

      // Si el profesor no existe, lo creamos
      if (!professor) {
        professor = await prisma.proffessor.create({
          data: {
            name: proffessorName.replaceAll(' ', '+').toLowerCase(),
            subject: createPostDto.subject,
            school: {
              connect: { id: school.id },
            },
          },
        });
      }

      // Creamos el post y asociamos el `professorId` recién creado o encontrado
      const post = await prisma.post.create({
        data: {
          title: createPostDto.title,
          content: createPostDto.content,
          author: {
            connect: { id: userId },
          },
          school: {
            connect: { id: school.id },
          },
          proffessor: {
            connect: { id: professor.id },
          },
        },
        include: {
          author: {
            select: {
              displayName: true,
            },
          },
        },
      });

      return post;
    });
    return post;
  }

  findAll() {
    return `This action returns all post`;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  async remove(id: string, userId: string) {
    try {
      const postExists = await this.prisma.post.findUnique({
        where: { id },
      });

      if (!postExists) throw new BadRequestException('Post not found');

      const userPost = await this.prisma.post.findUnique({
        where: { id },
      });

      if (userId !== userPost.authorId)
        throw new BadRequestException("You can't delete this post");

      await this.prisma.post.delete({
        where: { id },
      });

      return 'Post deleted successfully';
    } catch (error) {
      if (error instanceof BadRequestException)
        throw new BadRequestException(error.message);

      throw new InternalServerErrorException(error.message);
    }
  }
}
