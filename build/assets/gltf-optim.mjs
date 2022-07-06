
import { NodeIO } from '@gltf-transform/core';
import { dedup, quantize, weld } from '@gltf-transform/functions';
import basis from './gltf-transform-basis/basis.mjs';

export default async function optim( _input, _output ){
    const io = new NodeIO();
    const document = await io.read(_input);
    
    await document.transform(
        basis(),
        // weld(),
        quantize(),
        // dedup()
    );
    
    await io.write(_output, document);
}

