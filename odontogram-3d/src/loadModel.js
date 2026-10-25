import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CONFIG } from './config.js';
import { OdontogramModel } from './OdontogramModel.js';
import { createPlaceholderOdontogram } from './placeholder/ProceduralArch.js';

async function loadOverrides() {
  try {
    const response = await fetch(CONFIG.model.mapUrl, { cache: 'no-store' });
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Load the odontogram, falling back to the procedural stand-in when the real
 * asset is not in the repository yet.
 *
 * @param {(progress:number|null, label:string)=>void} [onProgress]
 * @returns {Promise<{model: OdontogramModel, placeholder: boolean}>}
 */
export async function loadOdontogram(onProgress = () => {}) {
  const overrides = await loadOverrides();

  try {
    onProgress(0, 'Loading model…');
    const loader = new GLTFLoader();
    if (CONFIG.model.dracoPath) {
      const draco = new DRACOLoader();
      draco.setDecoderPath(CONFIG.model.dracoPath);
      loader.setDRACOLoader(draco);
    }

    const gltf = await loader.loadAsync(CONFIG.model.url, (event) => {
      onProgress(event.total ? event.loaded / event.total : null, 'Loading model…');
    });

    const model = new OdontogramModel(gltf.scene, overrides).normalise();
    if (model.toothIds.length === 0) {
      throw new Error('no tooth state nodes found — check the naming convention');
    }
    return { model, placeholder: false };
  } catch (error) {
    console.warn(`[odontogram] falling back to the built-in stand-in: ${error.message}`);
    onProgress(null, 'Building stand-in arch…');
    const model = new OdontogramModel(createPlaceholderOdontogram(), overrides).normalise();
    return { model, placeholder: true };
  }
}
