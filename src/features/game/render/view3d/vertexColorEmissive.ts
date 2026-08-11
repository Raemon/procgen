import * as THREE from 'three';

const EMISSIVE_CHUNK = '#include <emissivemap_fragment>';

export function emissiveFollowsVertexColor(material: THREE.Material): void {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      EMISSIVE_CHUNK,
      `${EMISSIVE_CHUNK}\n\ttotalEmissiveRadiance *= vec3( vColor );`,
    );
  };
}
