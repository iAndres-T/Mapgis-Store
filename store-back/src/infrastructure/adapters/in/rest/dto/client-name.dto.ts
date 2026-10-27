import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ClientNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
