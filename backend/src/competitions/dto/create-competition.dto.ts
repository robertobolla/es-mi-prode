import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateCompetitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @IsIn(['copa', 'liga'])
  format?: string;
}
