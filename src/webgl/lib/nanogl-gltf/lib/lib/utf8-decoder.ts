

const utf8Decoder = (typeof TextDecoder !== 'undefined') ? new TextDecoder('utf-8') : null;

function inRange(a: number, min: number, max: number) {
  return min <= a && a <= max;
}

// This code is inspired by public domain code found here: https://github.com/inexorabletash/text-encoding
function utf8Handler(utfBytes:Uint8Array) {
  
  let codePoint = 0;
  let bytesSeen = 0;
  let bytesNeeded = 0;
  let lowerBoundary = 0x80;
  let upperBoundary = 0xBF;

  const codePoints = [];
  const length = utfBytes.length;

  for (let i = 0; i < length; ++i) {
    const currentByte = utfBytes[i];

    // If bytesNeeded = 0, then we are starting a new character
    if (bytesNeeded === 0) {
      // 1 Byte Ascii character
      if (inRange(currentByte, 0x00, 0x7F)) {
        // Return a code point whose value is byte.
        codePoints.push(currentByte);
        continue;
      }

      // 2 Byte character
      if (inRange(currentByte, 0xC2, 0xDF)) {
        bytesNeeded = 1;
        codePoint = currentByte & 0x1F;
        continue;
      }

      // 3 Byte character
      if (inRange(currentByte, 0xE0, 0xEF)) {
        // If byte is 0xE0, set utf-8 lower boundary to 0xA0.
        if (currentByte === 0xE0) {
          lowerBoundary = 0xA0;
        }
        // If byte is 0xED, set utf-8 upper boundary to 0x9F.
        if (currentByte === 0xED) {
          upperBoundary = 0x9F;
        }

        bytesNeeded = 2;
        codePoint = currentByte & 0xF;
        continue;
      }

      // 4 Byte character
      if (inRange(currentByte, 0xF0, 0xF4)) {
        // If byte is 0xF0, set utf-8 lower boundary to 0x90.
        if (currentByte === 0xF0) {
          lowerBoundary = 0x90;
        }
        // If byte is 0xF4, set utf-8 upper boundary to 0x8F.
        if (currentByte === 0xF4) {
          upperBoundary = 0x8F;
        }

        bytesNeeded = 3;
        codePoint = currentByte & 0x7;
        continue;
      }

      throw new Error('String decoding failed.');
    }

    // Out of range, so ignore the first part(s) of the character and continue with this byte on its own
    if (!inRange(currentByte, lowerBoundary, upperBoundary)) {
      codePoint = bytesNeeded = bytesSeen = 0;
      lowerBoundary = 0x80;
      upperBoundary = 0xBF;
      --i;
      continue;
    }

    // Set appropriate boundaries, since we've now checked byte 2 of a potential longer character
    lowerBoundary = 0x80;
    upperBoundary = 0xBF;

    // Add byte to code point
    codePoint = (codePoint << 6) | (currentByte & 0x3F);

    // We have the correct number of bytes, so push and reset for next character
    ++bytesSeen;
    if (bytesSeen === bytesNeeded) {
      codePoints.push(codePoint);
      codePoint = bytesNeeded = bytesSeen = 0;
    }
  }

  return codePoints;
}

// Exposed functions for testing
function decodeWithTextDecoder(view: Uint8Array) {
  return utf8Decoder.decode(view);
}


function decodeWithFromCharCode(view:Uint8Array) 
{
  let result = '';
  const codePoints = utf8Handler(view);
  for (let cp of codePoints) {
    if (cp <= 0xFFFF) {
      result += String.fromCharCode(cp);
    } else {
      cp -= 0x10000;
      result += String.fromCharCode((cp >> 10) + 0xD800,
        (cp & 0x3FF) + 0xDC00);
    }

  }
  return result;
}




const Decoder = (typeof TextDecoder !== 'undefined') ? decodeWithTextDecoder : decodeWithFromCharCode;
// const Decoder =  decodeWithFromCharCode;


export default Decoder;
