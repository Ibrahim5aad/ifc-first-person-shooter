import resolve from '@rollup/plugin-node-resolve';
import url from '@rollup/plugin-url';

export default {
  input: 'app.js',
  output: [
    {
      format: 'esm',
      file: 'bundle.js'
    },
  ],
  plugins: [
    resolve(),
    url({
      include: ['**/*.glb', '**/*.wav'],
      // destDir: './assets'
    })
  ]
};