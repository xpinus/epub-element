import { parallel, series } from 'gulp';
import { withTaskName, run, runTask } from './src/utils';

export * from './src/tasks';

function hello(cb) {
  console.log('Hello, world!');
  cb();
}

export default series(
  hello,
  withTaskName('clean', () => run('pnpm run clean')),
  parallel(runTask('build')),
);
