
'use server';

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { removeBackground } from '@/ai/flows/remove-background';
import type { RemoveBackgroundInput } from '@/ai/flows/remove-background';

const inputDir = path.join(process.cwd(), 'public', 'images-input');
const outputDir = path.join(process.cwd(), 'public', 'images-output');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const fileToDataUri = (fileBuffer: Buffer, mimeType: string): string => {
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
};

const dataUriToBuffer = (dataUri: string): { buffer: Buffer; mimeType: string } => {
  const parts = dataUri.split(',');
  if (parts.length !== 2) {
    throw new Error('Invalid Data URI format');
  }
  const meta = parts[0]; 
  const base64Data = parts[1];
  
  const mimeTypeMatch = meta.match(/:(.*?);/);
  const mimeType = mimeTypeMatch && mimeTypeMatch[1] ? mimeTypeMatch[1] : 'application/octet-stream';

  const buffer = Buffer.from(base64Data, 'base64');
  return { buffer, mimeType };
};

export interface ActionState {
  originalImageUrl?: string | null;
  processedImageUrl?: string | null;
  error?: string | null;
  message?: string | null;
}

export async function uploadAndProcessImageServerAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await mkdir(inputDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    const file = formData.get('image') as File | null;

    if (!file) {
      return { ...prevState, error: 'No image file provided.' };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { ...prevState, error: 'Invalid file type. Only PNG, JPG, JPEG are allowed.' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { ...prevState, error: 'File is too large. Maximum size is 5MB.' };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const originalFileExtension = path.extname(file.name) || `.${file.type.split('/')[1] || 'png'}`;
    const originalFilename = `${uuidv4()}${originalFileExtension}`;
    const originalPath = path.join(inputDir, originalFilename);
    const originalPublicUrl = `/images-input/${originalFilename}`;

    await writeFile(originalPath, fileBuffer);

    const originalImageDataUri = fileToDataUri(fileBuffer, file.type);
    
    const genkitInput: RemoveBackgroundInput = {
      imageDataUri: originalImageDataUri,
    };

    const genkitOutput = await removeBackground(genkitInput);

    if (!genkitOutput.processedImageDataUri) {
      return { ...prevState, error: 'Background removal failed. No processed image data returned.' , originalImageUrl: originalPublicUrl};
    }
    
    const { buffer: processedImageBuffer, mimeType: processedMimeType } = dataUriToBuffer(genkitOutput.processedImageDataUri);
    const processedFileExtensionGuess = processedMimeType.split('/')[1];
    const processedFileExtension = processedFileExtensionGuess && ALLOWED_FILE_TYPES.map(t => t.split('/')[1]).includes(processedFileExtensionGuess) 
                                   ? `.${processedFileExtensionGuess}` 
                                   : '.png'; // Default to png if mime type is odd or not an image
                                   
    const processedFilename = `${uuidv4()}-processed${processedFileExtension}`;
    const processedPath = path.join(outputDir, processedFilename);
    const processedPublicUrl = `/images-output/${processedFilename}`;

    await writeFile(processedPath, processedImageBuffer);
    
    return {
      message: 'Image processed successfully!',
      originalImageUrl: originalPublicUrl,
      processedImageUrl: processedPublicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    let errorMessage = 'An unexpected error occurred during processing.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Try to return original image URL even if processing fails partially
    const file = formData.get('image') as File | null;
    let originalPublicUrlOnError = null;
    if (file) {
        try {
            const originalFileExtension = path.extname(file.name) || `.${file.type.split('/')[1] || 'png'}`;
            const tempOriginalFilename = formData.get('tempOriginalFilename') as string || `${uuidv4()}${originalFileExtension}`; // Attempt to retrieve if set
            if (tempOriginalFilename) {
                 originalPublicUrlOnError = `/images-input/${tempOriginalFilename}`;
            }
        } catch (e) { /* ignore, best effort */ }
    }

    return { ...prevState, error: errorMessage, originalImageUrl: originalPublicUrlOnError, processedImageUrl: null };
  }
}
