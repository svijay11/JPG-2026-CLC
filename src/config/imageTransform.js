export const MIN_IMAGE_SCALE = 0.5;
export const MAX_IMAGE_SCALE = 3;
export const DEFAULT_IMAGE_SCALE = 1;
export const IMAGE_SCALE_STEP = 0.05;

export function clampImageScale(value) {
  return Math.min(MAX_IMAGE_SCALE, Math.max(MIN_IMAGE_SCALE, value));
}
