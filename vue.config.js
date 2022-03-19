/* eslint-disable */
const path = require('path')
const tapIfdefLoader = require( './build/vuecli/ifdef-loader')

module.exports = {
  lintOnSave: false,

  // configureWebpack : {
  //   module: {
  //     rules: [
  //       {
  //         test: /\.(vert|frag|glsl)$/,
  //         use: 'nanogl-template/lib/compiler'
  //       },
  //       {
  //         test: /\.(glb)$/,
  //         use: [
  //           {
  //             loader: "file-loader",
  //             options: {
  //               name: 'assets/[name].[hash:8].[ext]'
  //             }
  //           }
  //         ]
  //       }
  //     ]
  //   },
  // },

  chainWebpack(config){

    tapIfdefLoader(config.module.rule('ts'))

    config.resolve
      .alias
        .set('@webgl', path.resolve( __dirname, 'src/webgl'))

        .set('nanogl', path.resolve( __dirname, '../../nanogl/nanogl'))
        .set('nanogl-pbr', path.resolve( __dirname, '../../nanogl/nanogl-pbr'))



    config.module.rule('glsl')
      .test(/\.(vert|frag|glsl)$/ )
        .use( 'shader-hmr' )
        .loader( path.resolve( __dirname, 'build/shader-hmr/index.js') )
      .end()
        .use( 'nanogl-template' )
        .loader( 'nanogl-template/lib/compiler' )
      .end()
        

    config.module.rule('images')
      .exclude
      .add( path.resolve( __dirname, 'src/assets/webgl' ) )
      .end()


    config.module.rule('webgl-file')
      .test(/\.(glb|gltf|bin|ktx|jpg|jpeg|png|webp)$/ )
      .include
        .add( path.resolve( __dirname, 'src/assets/webgl' ) )
        .end()
      .use( 'file-loader' )
        .loader( 'file-loader' )
          .options({
            name: 'assets/webgl/[name].[hash:8].[ext]'
          })
  }

}
