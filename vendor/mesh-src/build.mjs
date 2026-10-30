import {build} from 'esbuild';
import {nodeModulesPolyfillPlugin} from 'esbuild-plugins-node-modules-polyfill';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
await build({absWorkingDir:root,entryPoints:['entry.js'],outfile:'../mesh.js',bundle:true,minify:true,
  format:'esm',platform:'browser',target:'es2020',define:{'process.env.NODE_ENV':'"production"'},
  plugins:[nodeModulesPolyfillPlugin({globals:{Buffer:true,process:true}})],legalComments:'external'});
