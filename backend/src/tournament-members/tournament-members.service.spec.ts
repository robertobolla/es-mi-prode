import { Test, TestingModule } from '@nestjs/testing';
import { TournamentMembersService } from './tournament-members.service';

describe('TournamentMembersService', () => {
  let service: TournamentMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TournamentMembersService],
    }).compile();

    service = module.get<TournamentMembersService>(TournamentMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
