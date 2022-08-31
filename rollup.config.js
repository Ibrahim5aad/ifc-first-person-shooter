import resolve from '@rollup/plugin-node-resolve';
import url from '@rollup/plugin-url';
import nodePolyfills from 'rollup-plugin-polyfill-node';

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
      include: ['**/*.glb', '**/*.wav', '**/*.mp3'],
      
      // destDir: './assets'
    }),
    nodePolyfills( /* options */ )
  ]
};