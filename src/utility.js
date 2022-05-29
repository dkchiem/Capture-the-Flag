export function* nextTeamGenerator(team) {
  const teams = [team.RED, team.BLUE];
  let n = 0;
  while (true) {
    yield teams[n++ % teams.length];
  }
}
