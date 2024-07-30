import { parallel, series } from 'gulp';
import { withTaskName, run, runTask } from './src/utils';

export * from './src/tasks';

function hello(cb) {
  let logo =
    "  _____ ____  _   _ ____    _____ _                           _   \n | ____|  _ \\| | | | __ )  | ____| | ___ _ __ ___   ___ _ __ | |_ \n |  _| | |_) | | | |  _ \\  |  _| | |/ _ \\ '_ ` _ \\ / _ \\ '_ \\| __|\n | |___|  __/| |_| | |_) | | |___| |  __/ | | | | |  __/ | | | |_ \n |_____|_|    \\___/|____/  |_____|_|\\___|_| |_| |_|\\___|_| |_|\\__|\n                                                                  ";
  console.log('#############################################################################');
  console.log(logo);
  console.log('#############################################################################');

  cb();
}

export default series(
  hello,
  withTaskName('clean', () => run('pnpm run clean')),
  parallel(runTask('build')),
);
