import path from 'path';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import esbuild from 'rollup-plugin-esbuild';
import strip from '@rollup/plugin-strip';

import { PKG_ROOT, PKG_OUTPUT, ROOT_PATH } from '../utils';
import pkg from '../../../../package.json';

const buildOutputOptionsList = [
  // es module
  {
    format: 'es',
    ext: 'mjs',
  },
  //  通用模块定义规范，同时支持 amd，cjs 和 iife
  // {
  //   format: 'umd',
  //   ext: 'js',
  // },
];

export async function build(cb) {
  const bundle = await rollup({
    input: path.resolve(PKG_ROOT, 'index.ts'),
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: path.resolve(ROOT_PATH, 'tsconfig.json'),
      }), // 用它来生成.d.ts，esbuild插件说是可以但好像并没有起作用
      esbuild({
        include: /\.[jt]sx?$/,
        exclude: /node_modules/,
        target: 'es2015',
        sourceMap: true,
        minify: true,
      }),
      strip({
        include: /\.[jt]sx?$/,
        functions: ['console.log'],
      }), // 删除console
    ],
    external: [...Object.keys(pkg.dependencies)],
  });

  for (const config of buildOutputOptionsList) {
    bundle.write({
      format: config.format,
      dir: path.resolve(PKG_OUTPUT, config.format),
      sourcemap: true,
      name: 'EpubEl',
      entryFileNames: `[name].${config.ext}`,
      globals: {
        uuid: 'uuid',
        '@zip.js/zip.js': 'zip',
        'xml-js': 'xmlJs',
        'mark-stage': 'markstage',
      },
    });
  }

  cb();
}
