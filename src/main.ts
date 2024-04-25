import Engine from './gl/Engine'
import SampleActivity from './gl/activities/SampleActivity'
import TestActivity from './gl/activities/TestActivity';
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="gl-canvas" class="gl-canvas"></canvas>
  </div>
`

let engine: Engine;
engine = await Engine.Create()
// engine.addActivity( e => new TestActivity( e ) )
engine.addActivity( e => new SampleActivity( e ) )
engine.start()