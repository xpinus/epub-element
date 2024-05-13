import { spawn } from 'child_process';
import chalk from 'chalk';
import consola from 'consola';
import { ROOT_PATH, BUILD_ROOT } from '../utils';

// 创建子进程来执行命令行语句
export const run = async (command, cwd = ROOT_PATH) =>
  new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    consola.info(`cmd: ${chalk.green(`${cmd} ${args.join(' ')}`)}`); // 打印美化的控制台输出
    console.log(cwd);
    const app = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    const onProcessExit = () => app.kill('SIGHUP');

    app.on('close', (code) => {
      process.removeListener('exit', onProcessExit);

      if (code === 0) resolve();
      else reject(new Error(`Cmd failed! \n Command: ${command} \n Code: ${code}`));
    });
    process.on('exit', onProcessExit);
  });

// 指定函数的优先显示名称
export const withTaskName = (name, fn) => Object.assign(fn, { displayName: name });

// 执行一个gulp任务
export const runTask = (name) => withTaskName(`shellTask:${name}`, () => run(`pnpm run start ${name}`, BUILD_ROOT));
