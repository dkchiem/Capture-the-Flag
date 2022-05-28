export function updateLeaderboard(points) {
  const redPointsText = document.querySelector('#red-points');
  const bluePointsText = document.querySelector('#blue-points');
  redPointsText.innerText = points.red;
  bluePointsText.innerText = points.blue;
}
