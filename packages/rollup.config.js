import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import preset from '@babel/preset-env';
import {terser} from 'rollup-plugin-terser';
import camelCase from 'lodash.camelcase';
import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';

const pkg = require(`${process.cwd()}/package.json`);
const name = camelCase(pkg.name);
function create(args) {
  const {module, ...rest} = args;
  const format = 'esm';
  const plugins = [
    progress({clearline:false}),
    filesize({showMinifiedSize: false}),
    babel({presets: [[preset, {targets: {esmodules: true}}]]}),
    terser(),
  ];
  return {
    input: pkg.main,
    output: {
      name,
      format,
      file: module ? pkg.module : pkg.browser,
    },
    plugins: module ? plugins : [resolve(), ...plugins],
    ...rest
  };
}

export default [
  create({module: true}),
  create({module: false}),
];