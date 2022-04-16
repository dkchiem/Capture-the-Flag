const columns = parseInt(process.argv.slice(2)[0]);
const rows = parseInt(process.argv.slice(2)[1]);

const array = Array(rows)
  .fill(0)
  .map(() => Array(columns).fill(0));

function pbcopy(data) {
  var proc = require('child_process').spawn('pbcopy');
  proc.stdin.write(data);
  proc.stdin.end();
}
pbcopy(JSON.stringify(array).replace(/\],/g, '],\n'));

console.log('Array copied to clipboard!');
