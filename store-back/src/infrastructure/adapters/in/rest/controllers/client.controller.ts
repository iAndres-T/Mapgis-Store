import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ManageClientsUseCase } from '@application/ports/in';
import { Role } from '@domain/model';
import { UserMapper } from '@infrastructure/mappers';
import { Roles } from '@infrastructure/adapters/in/rest/decorators';
import {
  ClientNameDto,
  UserResponse,
} from '@infrastructure/adapters/in/rest/dto';

@Controller('clients')
@Roles(Role.ADMIN)
export class ClientController {
  constructor(private readonly clients: ManageClientsUseCase) {}

  @Post()
  async create(@Body() dto: ClientNameDto): Promise<UserResponse> {
    return UserMapper.toResponse(await this.clients.create(dto.name));
  }

  @Get()
  async list(): Promise<UserResponse[]> {
    const clients = await this.clients.list();
    return clients.map((client) => UserMapper.toResponse(client));
  }

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponse> {
    return UserMapper.toResponse(await this.clients.findById(id));
  }

  @Patch(':id')
  async rename(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClientNameDto,
  ): Promise<UserResponse> {
    return UserMapper.toResponse(await this.clients.rename(id, dto.name));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.clients.delete(id);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.clients.resetPassword(id);
  }
}
