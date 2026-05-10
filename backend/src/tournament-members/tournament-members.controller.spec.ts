import { Test, TestingModule } from '@nestjs/testing';
import { TournamentMembersController } from './tournament-members.controller';

describe('TournamentMembersController', () => {
  let controller: TournamentMembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TournamentMembersController],
    }).compile();

    controller = module.get<TournamentMembersController>(TournamentMembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
