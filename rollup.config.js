import { defineConfig } from 'rollup'
import vue from 'rollup-plugin-vue'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'

export default defineConfig({
    input: 'src/index.js',
    external: ['vue', 'quasar'],
    output: [
        {
            file: 'dist/index.js',
            format: 'cjs',
            exports: 'named'
        },
        {
            file: 'dist/index.esm.js',
            format: 'es',
            exports: 'named'
        }
    ],
    plugins: [
        nodeResolve({
            preferBuiltins: false
        }),
        commonjs(),
        vue({
            css: false
        }),
        postcss({
            extract: true,
            minimize: true
        })
    ]
})