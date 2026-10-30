const fs = require('fs'), vm = require('vm'), assert = require('assert'), ts = require('typescript');
let options = 'WINEDLLOVERRIDES="dinput8=n,b" %command% --steamless -windowed';
let written;
const sandbox = {exports:{}, require:()=>({}), window:{SteamClient:{Apps:{GetLaunchOptionsForApp:()=>options, SetAppLaunchOptions:(_, text)=>{written=text;}}}}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/fixRuntime.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,sandbox);
const strip=sandbox.exports.stripSteamlessLaunchOption;
assert.equal(strip('foo --steamless bar'), 'foo  bar');
assert.equal(strip('foo "--steamless"'), 'foo');
assert.equal(strip("foo '-steamless'"), 'foo');
assert.equal(strip('bash -c "foo --steamless bar" %command%'), 'bash -c "foo --steamless bar" %command%');
assert.equal(strip('--steamless-other --other=steamless'), '--steamless-other --other=steamless');
sandbox.exports.clearSteamlessLaunchOption(1);
assert(written.includes('WINEDLLOVERRIDES="dinput8=n,b"'));
assert(written.includes('-windowed'));
assert(!written.includes('--steamless'));
console.log('SteamStub launch option cleanup preserves other arguments');

const {spawnSync} = require('child_process');
const os = require('os'), path = require('path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'slsdeck launch '));
const game = path.join(tmp, 'fake game.cjs');
fs.writeFileSync(game, 'console.log(JSON.stringify({args:process.argv.slice(2),env:process.env.SLS_TEST}))');
const shellQuote = text => "'" + text.replace(/'/g, "'\\''") + "'";
try {
  for (const original of ['', '-windowed "arg with spaces"', 'SLS_TEST=value %command% "arg with spaces"', '%command% -windowed', '%command% --steamless -windowed']) {
    options = original; written = undefined;
    sandbox.exports.enableSteamlessLaunchOption(1);
    const enabled = written;
    assert(enabled.includes('--steamless '));
    assert(enabled.includes('/bin/bash -c'));
    const result = spawnSync('/bin/bash', ['-c', enabled.replace('%command%', shellQuote(process.execPath) + ' ' + shellQuote(game))], {encoding:'utf8'});
    assert.equal(result.status, 0, result.stderr);
    const delivered = JSON.parse(result.stdout);
    assert(!delivered.args.includes('--steamless'));
    if (original.includes('arg with spaces')) assert(delivered.args.includes('arg with spaces'));
    if (original.includes('-windowed')) assert(delivered.args.includes('-windowed'));
    if (original.includes('SLS_TEST=')) assert.equal(delivered.env,'value');
    options = enabled; written = undefined;
    sandbox.exports.enableSteamlessLaunchOption(1);
    assert.equal(written, undefined, 'enabling twice must not nest wrappers');
    sandbox.exports.clearSteamlessLaunchOption(1);
    assert(!written.includes('--steamless'));
    assert(!written.includes('/bin/bash -c'));
  }
  options = '%command% --steamless -windowed'; written = undefined;
  sandbox.exports.repairSteamlessLaunchOption(1);
  assert(written.includes('/bin/bash -c'));
  options = '%command% -windowed'; written = undefined;
  sandbox.exports.repairSteamlessLaunchOption(1);
  assert.equal(written, undefined, 'unrelated launch options must stay unchanged');
} finally { fs.rmSync(tmp,{recursive:true,force:true}); }
console.log('Real shell launches preserve arguments, consume Steamless marker, and support Un-fix');
