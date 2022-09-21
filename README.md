# gl_starter

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).



### Features


#### Dev / Debug mode

Dev tools and debug code can be enabled by setting the `VUE_APP_DEBUG` environment flag to `true`. Ifdef-loader is used to ensure no debug code remain in production. To add debug code make sure to wrap it inside a `/// #if DEBUG` ... `/// #endif` block.

Note : You can use `Gui` and `DebugDraw` features outside DEBUG block. They are removed from production but but replaced by dummy/noop implementation 

#### GUI (tweakpane)

The module `gui` provide a way to add DatGui like controls (using Tweakpane). It's available even when DEBUG is disabled, but replaced by noop dummy. Decorators are also provided for convenience.
Some examples are available [here](src/webgl/samples/devtools/GuiTestObject.ts)

#### Debug Camera

The renderer have initilly 2 cameras, a main camera and a debug one. You can switch camera in the Gui. The Debug camera provide 2 different control scheme (3DSMax and Blender) you can change the scheme in the .env  files by editing `VUE_APP_DEV_CAMERA_SCHEME` var.
   
#### HMR (textures, shaders)



#### Samples


 