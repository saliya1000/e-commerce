import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export interface ProcessedImages {
  url: string;
  thumbnailUrl: string;
  mediumUrl: string;
}

export const processProductImage = async (
  filePath: string,
  filename: string,
  baseUrl: string
): Promise<ProcessedImages> => {
  const uploadDir = path.dirname(filePath);
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);

  const thumbFilename = `${name}-thumb.webp`;
  const mediumFilename = `${name}-medium.webp`;
  const largeFilename = `${name}-large.webp`;

  const thumbPath = path.join(uploadDir, thumbFilename);
  const mediumPath = path.join(uploadDir, mediumFilename);
  const largePath = path.join(uploadDir, largeFilename);

  // Read original image once
  const image = sharp(filePath);

  // Generate Thumbnail (150x150 cover)
  await image
    .clone()
    .resize(150, 150, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  // Generate Medium (500x500 cover)
  await image
    .clone()
    .resize(500, 500, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(mediumPath);

  // Generate Large (Max 1200x1200 inside)
  await image
    .clone()
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(largePath);

  // Delete the original uploaded file to save space
  fs.unlinkSync(filePath);

  return {
    url: `/api/uploads/${largeFilename}`,
    thumbnailUrl: `/api/uploads/${thumbFilename}`,
    mediumUrl: `/api/uploads/${mediumFilename}`
  };
};
