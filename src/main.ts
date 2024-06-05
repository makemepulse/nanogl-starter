import Engine from './gl/Engine'
import ParticlesTeleportActivity from './gl/activities/ParticlesTrails/ParticlesTeleportActivity';
import ParticlesTrailActivity from './gl/activities/ParticlesTrails/ParticlesTrailActivity';
import SampleActivity from './gl/activities/SampleActivity'
import TestActivity from './gl/activities/TestActivity';
import { testReflect } from './gl/wgsl/testReflect';
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="gl-canvas" class="gl-canvas"></canvas>
  </div>
`
testReflect()

let engine: Engine;
engine = await Engine.Create()
// engine.addActivity( e => new ParticlesTrailActivity( e ) )
// engine.addActivity( e => new TestActivity( e ) )
// engine.addActivity( e => new SampleActivity( e ) )
engine.addActivity( e => new ParticlesTeleportActivity( e ) )
engine.start()