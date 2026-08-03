/**
 * Static registry for content images. Metro can only bundle statically
 * `require`d assets, so every image referenced by an item's `imageAsset`
 * (relative path under assets/content-images/) must be registered here.
 * `npm run check:content` verifies the JSON side; a missing entry here
 * surfaces as a "Bild saknas" placeholder in the drill.
 */
export const contentImages: Record<string, number> = {
  'radar/exempel-1.png': require('../../assets/content-images/radar/exempel-1.png'),
  'chart/exempel-1.png': require('../../assets/content-images/chart/exempel-1.png'),
};
