import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty()
  phaseId: string;

  @IsString()
  @IsOptional()
  groupId?: string;

  @IsString()
  @IsOptional()
  homeTeamId?: string;

  @IsString()
  @IsOptional()
  awayTeamId?: string;

  @IsDateString()
  @IsNotEmpty()
  matchDate: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  homeScore90?: number;

  @IsNumber()
  @IsOptional()
  awayScore90?: number;

  @IsNumber()
  @IsOptional()
  homeScore120?: number;

  @IsNumber()
  @IsOptional()
  awayScore120?: number;
}

