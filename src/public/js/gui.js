export function updateLeaderboard(points) {
  const redPointsText = document.querySelector('#red-points');
  const bluePointsText = document.querySelector('#blue-points');
  redPointsText.innerText = points.red;
  bluePointsText.innerText = points.blue;
}

export function updateHpBar(hp) {
  const hpBar = document.querySelector('#hp');
  hpBar.style.width = hp >= 0 ? `${hp}%` : '0%';
  if (hp <= 100 && hp > 50) {
    hpBar.style.backgroundColor = '#6bcb77';
  } else if (hp <= 50 && hp > 20) {
    hpBar.style.backgroundColor = '#FFD93D';
  } else if (hp <= 20) {
    hpBar.style.backgroundColor = '#FF6B6B';
  }
}
