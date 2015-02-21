var patch = ['silly', 'debug', 'verbose', 'info', 'warn', 'error']
  , map = ['info', 'info', 'log', 'info', 'warn', 'error']
  , i = patch.length;

while(i--) {
  if(!console[patch[i]]) {
    console[patch[i]] = console[map[i]];
  }
}
