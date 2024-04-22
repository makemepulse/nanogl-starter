import Engine from './gl/Engine'
import SampleActivity from './gl/activities/SampleActivity'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="gl-canvas" class="gl-canvas"></canvas>
  </div>
`

let engine: Engine;
engine = await Engine.Create()
engine.addActivity( e => new SampleActivity( e ) )
engine.start()