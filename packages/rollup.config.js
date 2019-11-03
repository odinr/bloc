import typescript from 'rollup-plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import camelCase from 'lodash.camelcase';
import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';

const pkg = require(`${process.cwd()}/package.json`);
const name = camelCase(pkg.name);
function create(module) {
  const plugins = [
    typescript({
      "module": "es6",
    }),
    progress({clearline:false}),
    filesize({showMinifiedSize: false}),
    terser({output: {comments: () => ''}}),
  ];
  return {
    input: `${process.cwd()}/src/index.ts`,
    output: {
      name,
      format: 'esm',
      file: module ? pkg.module : pkg.browser,
    },
    plugins: module ? plugins : [resolve(), ...plugins],
  };
}

export default [
  create(true),
  create(false),
];