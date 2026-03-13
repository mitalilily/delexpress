export const VOLUMETRIC_DIVISOR = 5000;

export function calculateVolumetricWeight({ length, width, height }) {
  const dimensions = [length, width, height].map((value) => Number(value) || 0);
  const hasInvalidValue = dimensions.some((value) => value <= 0);

  if (hasInvalidValue) {
    return 0;
  }

  return Number(((dimensions[0] * dimensions[1] * dimensions[2]) / VOLUMETRIC_DIVISOR).toFixed(2));
}

export function calculateChargeableWeight({ actualWeight, volumetricWeight }) {
  return Math.max(Number(actualWeight) || 0, Number(volumetricWeight) || 0);
}
