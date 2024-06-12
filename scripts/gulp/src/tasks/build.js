import path from 'path';

import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';

import { PKG_ROOT, PKG_OUTPUT } from '../utils';
import pkg from '../../../../package.json';

const buildOutputOptionsList = [
  // es module
  {
    format: 'es',
    ext: 'mjs',
  },
  //  通用模块定义规范，同时支持 amd，cjs 和 iife
  {
    format: 'umd',
    ext: 'js',
  },
];

export async function build(cb) {
  const bundle = await rollup({
    input: path.resolve(PKG_ROOT, 'index.ts'),
    plugins: [
      nodeResolve(),
      commonjs(),
      esbuild({
        include: /\.[jt]sx?$/,
        exclude: /node_modules/,
        target: 'es2018',
        sourceMap: true,
        minify: true,
      }),
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
      },
    });
  }

  cb();
}
