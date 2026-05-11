/**
 * Round-Robin League Fixture Generator
 *
 * Uses the "circle method" to generate a balanced schedule where every team
 * plays every other team exactly once (ida) or twice (ida y vuelta).
 *
 * For N teams (even):
 *   - N-1 matchdays, each with N/2 matches
 * For N teams (odd):
 *   - N matchdays, each with (N-1)/2 matches + 1 "Libre" (bye)
 */

export interface FixtureMatch {
  homeTeamId: string | null; // null = "Libre" (bye)
  awayTeamId: string | null; // null = "Libre" (bye)
}

export interface Matchday {
  matchdayNumber: number;
  matches: FixtureMatch[];
}

/**
 * Generate round-robin fixtures for a list of team IDs.
 *
 * @param teamIds - Array of team IDs
 * @param roundTrip - If true, generates home+away (ida y vuelta)
 * @returns Array of matchdays with their matches
 */
export function generateRoundRobinFixtures(
  teamIds: string[],
  roundTrip: boolean,
): Matchday[] {
  if (teamIds.length < 2) {
    return [];
  }

  // If odd number of teams, add a null placeholder for "Libre" (bye)
  const teams = [...teamIds];
  const hasbye = teams.length % 2 !== 0;
  if (hasbye) {
    teams.push(null as any); // null represents "Libre"
  }

  const n = teams.length;
  const totalRounds = n - 1;
  const matchesPerRound = n / 2;

  // Circle method:
  // Fix the first team, rotate the rest
  const fixed = teams[0];
  const rotating = teams.slice(1);

  const idaMatchdays: Matchday[] = [];

  for (let round = 0; round < totalRounds; round++) {
    const matches: FixtureMatch[] = [];

    // First match: fixed team vs the team at position 0 of rotating array
    const opponent = rotating[0];
    // Alternate home/away for the fixed team each round
    if (round % 2 === 0) {
      matches.push({ homeTeamId: fixed, awayTeamId: opponent });
    } else {
      matches.push({ homeTeamId: opponent, awayTeamId: fixed });
    }

    // Remaining matches: pair from outside in
    for (let i = 1; i < matchesPerRound; i++) {
      const home = rotating[i];
      const away = rotating[rotating.length - i];
      matches.push({ homeTeamId: home, awayTeamId: away });
    }

    idaMatchdays.push({
      matchdayNumber: round + 1,
      matches: matches.filter(
        (m) => m.homeTeamId !== null && m.awayTeamId !== null,
      ),
    });

    // Rotate: move last element to front
    const last = rotating.pop()!;
    rotating.unshift(last);
  }

  if (!roundTrip) {
    return idaMatchdays;
  }

  // Vuelta: mirror with home/away swapped
  const vueltaMatchdays: Matchday[] = idaMatchdays.map((md, index) => ({
    matchdayNumber: totalRounds + index + 1,
    matches: md.matches.map((m) => ({
      homeTeamId: m.awayTeamId,
      awayTeamId: m.homeTeamId,
    })),
  }));

  return [...idaMatchdays, ...vueltaMatchdays];
}
