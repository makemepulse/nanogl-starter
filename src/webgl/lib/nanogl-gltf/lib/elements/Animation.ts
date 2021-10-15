

import AnimationChannel from './AnimationChannel';
import AnimationSampler from './AnimationSampler';

import Gltf2 from '../types/Gltf2'
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';
import { GLContext } from 'nanogl/types';




export default class Animation implements IElement {

  readonly gltftype : GltfTypes.ANIMATION = GltfTypes.ANIMATION;

  name        : undefined | string;
  extras      : any   ;

  samplers : AnimationSampler[];
  channels : AnimationChannel[];

  duration  = 0

  
  async parse(gltfLoader:GltfLoader, data : Gltf2.IAnimation) : Promise<any> {

    const samplerPromises = data.samplers.map( (data)=>gltfLoader._loadElement(data) );
    this.samplers = await Promise.all( samplerPromises );

    for (const sampler of this.samplers) {
      this.duration = Math.max( sampler.maxTime );
    }

    const channelPromises = data.channels.map( (data)=>gltfLoader._loadElement(data) );
    this.channels = await Promise.all( channelPromises );
    
  }


  evaluate( t :number ){
    for (const channel of this.channels ) {
      channel.evaluate( t );
    }
  }


  getChannel(i:number):AnimationChannel {
    return this.channels[i];
  }


  getSampler(i:number):AnimationSampler {
    return this.samplers[i];
  }

}
