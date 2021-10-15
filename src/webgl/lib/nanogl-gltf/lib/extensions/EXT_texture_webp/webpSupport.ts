
//https://developers.google.com/speed/webp/faq#in_your_own_javascript


const kTestImages = {
    lossy: "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
    lossless: "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==",
    alpha: "UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==",
    animation: "UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA"
};

type Features = keyof typeof kTestImages


async function _check_webp_feature( feature : Features ) : Promise<boolean> {
  return new Promise( (resolve, reject)=>{
    const img = new Image();
    img.onload = ()=>resolve((img.width > 0) && (img.height > 0));
    img.onerror = ()=>resolve(false);
    img.src = "data:image/webp;base64," + kTestImages[feature];
  })
}


const _testResultPromise : Promise<boolean> = Promise.all([
  _check_webp_feature( 'lossy' ),
  _check_webp_feature( 'lossless' ),
  _check_webp_feature( 'alpha' ),
  _check_webp_feature( 'animation' ),
]).then( (results:boolean[])=>{
  return results.every(v=>v)
})


export function webpSupport() : Promise<boolean>{
  return _testResultPromise;
}