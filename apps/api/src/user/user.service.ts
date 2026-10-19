import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { UpdateUserDto } from "./dto/update-user.dto"

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    })
    if (!user) throw new NotFoundException("User not found")
    // Password and email changes must go through Better Auth.
    return this.prisma.user.update({
      where: { id },
      data: { name: updateUserDto.name, avatar: updateUserDto.avatar },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }
}
