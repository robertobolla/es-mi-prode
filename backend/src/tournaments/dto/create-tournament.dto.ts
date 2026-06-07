import { IsString, IsOptional, IsBoolean, IsInt, IsUUID, IsObject } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  competitionId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsInt()
  maxParticipants?: number;

  @IsOptional()
  @IsBoolean()
  creatorParticipates?: boolean;

  @IsOptional()
  @IsBoolean()
  includeExtraTime?: boolean;

  @IsOptional()
  @IsBoolean()
  predictGroups?: boolean;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsBoolean()
  roundTrip?: boolean;

  @IsOptional()
  @IsBoolean()
  predictMvp?: boolean;

  @IsOptional()
  @IsBoolean()
  predictTopScorer?: boolean;

  @IsOptional()
  @IsBoolean()
  predictGoalkeeper?: boolean;

  @IsOptional()
  @IsObject()
  pointsSystem?: Record<string, number>;

  @IsOptional()
  @IsString()
  paymentTransactionId?: string;
}
