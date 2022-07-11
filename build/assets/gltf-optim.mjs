
import { NodeIO } from '@gltf-transform/core';
import { dedup, mozjpeg, quantize, weld } from '@gltf-transform/functions';
import basis from './gltf-transform-basis/basis.mjs';
import squoosh from '@squoosh/lib';

export default async function optim( _input, _output ){
    const io = new NodeIO();
    const document = await io.read(_input);
    
    await document.transform(
        
        // basis({slots:['occlusionTexture', 'baseColorTexture', 'metallicRoughnessTexture']}),
        mozjpeg({slots:['normalTexture'], squoosh}),

        // weld(),
        quantize(),
        // dedup()
    );
    
    await io.write(_output, document);
}

