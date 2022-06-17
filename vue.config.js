/* eslint-disable */
const path = require('path')
const GenerateAssetsIds = require('./build/gen-assets-ids')
const ifdefOpts = require( './build/vuecli/ifdef-loader')


const https = process.env.DEV_SERVE_HTTPS === 'true'
const cert  = process.env.DEV_HTTPS_CERT
const key   = process.env.DEV_HTTPS_KEY

module.exports = {
  lintOnSave: false,

  publicPath: process.env.PUBLIC_PATH,


  devServer: {

    client:{
      webSocketURL: {
        protocol: https ? 'wss' : 'ws'
      },
    },

    server: {
      type: https ? 'https' : 'http',
      options: {
        key,
        cert,
      },
    },

  },



  chainWebpack(config){

    config.module.rule('ts')
      .use('ifdef-loader')
        .loader('ifdef-loader')
        .options(ifdefOpts)
      .end()

      config.resolve
      .alias
        .set('@webgl', path.resolve( __dirname, 'src/webgl'))

        // .set('nanogl', path.resolve( __dirname, '../../nanogl/nanogl'))
        // .set('nanogl-pbr', path.resolve( __dirname, '../../nanogl/nanogl-pbr'))



    config.module.rule('glsl')

      .test(/\.(vert|frag|glsl)$/ )

      .use('ifdef-loader')
        .loader('ifdef-loader')
        .options(ifdefOpts)
      .end()
      
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


    config.module.rule('webgl-assets')
      .test(/\.(glb|gltf|bin|ktx|ktx2|jpg|jpeg|png|webp|basis)$/ )
      .include
        .add( path.resolve( __dirname, 'src/assets/webgl' ) )
        .end()
      .use( 'file-loader' )
        .loader( 'file-loader' )
          .options({
            name: 'assets/webgl/[name].[hash:8].[ext]',
            esModule: true
          })
          
    if( process.env.VUE_APP_GENERATE_ASSETS_IDS === 'true' ){
      config
        .plugin('gen-asset-ids')
        .use( GenerateAssetsIds, [{
          output:path.resolve( __dirname, 'src/webgl/resources/AssetsIdentifiers.ts')
        }]);
    }
  }

}
