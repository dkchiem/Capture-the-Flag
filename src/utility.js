export function* nextTeamGenerator(team) {
  const teams = [team.RED, team.BLUE];
  let n = 0;
  while (true) {
    yield teams[n++ % teams.length];
  }
}

// let dir =
// (playersData[id].facingAngle - player.facingAngle) / (Math.PI * 2);

// dir -= Math.round(dir);
// dir = dir * Math.PI * 2;

// let dir = playersData[id].facingAngle - player.facingAngle;
// otherPlayers[id].facingAngle += dir * 0.1;
