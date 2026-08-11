import * as THREE from 'three';

export function textureLoadingIdle(): () => boolean {
  let loading = false;
  const manager = THREE.DefaultLoadingManager;
  manager.onStart = () => {
    loading = true;
  };
  manager.onLoad = () => {
    loading = false;
  };
  manager.onError = () => {
    loading = false;
  };
  return () => !loading;
}
