
import { mat4 } from 'gl-matrix';


import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';
import { ICameraLens } from 'nanogl-camera/ICameraLens';
import PerspectiveLens from 'nanogl-camera/perspective-lens';
import OrthographicLens from 'nanogl-camera/ortho-lens';


type ProjectionData = Gltf2.ICameraPerspective | Gltf2.ICameraOrthographic;



export default class Camera implements IElement {

  
  readonly gltftype : GltfTypes.CAMERA = GltfTypes.CAMERA;

  name        : undefined | string;
  extras      : any   ;
  
  type : Gltf2.CameraType;
  projectionData : ProjectionData;

  lens : ICameraLens;

  parse( gltfLoader:GltfLoader, data: Gltf2.ICamera ) : Promise<any>{


    this.type = data.type;
  

    switch( this.type ){
      
      case Gltf2.CameraType.PERSPECTIVE:
        this.projectionData = data.perspective;
        this.lens = this.createPerpective( this.projectionData );
        break;
      
      case Gltf2.CameraType.ORTHOGRAPHIC:
        this.projectionData = data.orthographic;
        this.lens = this.createOrtho( this.projectionData );
        break;

      default:
        throw new Error('Camera - unsupported type '+this.type );
        
    }

    return Promise.resolve();


  }

 
  createPerpective( data : Gltf2.ICameraPerspective ) : ICameraLens {
    const lens = new PerspectiveLens();
    lens.near = data.znear
    lens.far  = data.zfar ?? 100 // todo: infinite projection
    lens.setVerticalFov( data.yfov )
    lens.aspect = data.aspectRatio ?? 1
    return lens;
  }

  createOrtho( data : Gltf2.ICameraOrthographic ){
    const lens = new OrthographicLens();
    lens.near = data.znear
    lens.far  = data.zfar
    lens._xMin = -data.xmag;
    lens._xMax = data.xmag ;
    lens._yMin = -data.ymag;
    lens._yMax = data.ymag ;
    return lens;
  }
  

}




















