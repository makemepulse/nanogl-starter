
#define _SPZ_POS_ {{@positionExpression}}

vec3 spherePos = spherizeRadius() * normalize(_SPZ_POS_ - spherizeCenter());
_SPZ_POS_ = mix( _SPZ_POS_, spherePos, spherizeAmount() );
