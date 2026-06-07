import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean, IsObject } from 'class-validator';

export class CreateCompetitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @IsIn(['copa', 'liga'])
  format?: string;

  @IsString()
  @IsOptional()
  officialMvpId?: string | null;

  @IsString()
  @IsOptional()
  officialTopScorerId?: string | null;

  @IsString()
  @IsOptional()
  officialGoalkeeperId?: string | null;

  @IsBoolean()
  @IsOptional()
  predictMvp?: boolean;

  @IsBoolean()
  @IsOptional()
  predictTopScorer?: boolean;

  @IsBoolean()
  @IsOptional()
  predictGoalkeeper?: boolean;

  @IsBoolean()
  @IsOptional()
  predictGroups?: boolean;

  @IsObject()
  @IsOptional()
  pointsSystem?: Record<string, number>;
}
