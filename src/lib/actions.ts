
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
    throw new Error('Invalid Data URI format: expected two parts separated by a comma.');
  }
  
  const meta = parts[0]; // e.g., "data:image/png;base64"
  const base64Data = parts[1];

  if (!meta.includes(';base64')) {
    throw new Error('Invalid Data URI format: must be base64 encoded.');
  }
  
  const mimeTypeMatch = meta.match(/^data:(.*?);base64$/);
  const mimeType = mimeTypeMatch && mimeTypeMatch[1] ? mimeTypeMatch[1] : 'application/octet-stream';

  if (mimeType === 'application/octet-stream' && !meta.startsWith('data:')) {
    // If it's octet-stream and doesn't look like a data URI, something is wrong.
    throw new Error('Invalid Data URI: unrecognized mime type or format.');
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    return { buffer, mimeType };
  } catch (error) {
    console.error("Error decoding base64 data from Data URI:", error);
    throw new Error("Failed to decode base64 data from Data URI.");
  }
};

export interface ActionState {
  originalImageUrl?: string | null;
  processedImageUrl?: string | null;
  error?: string | null;
  message?: string | null;
  uploadProgress?: number | null;
}

export async function uploadAndProcessImageServerAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let originalPublicUrl: string | null = null;
  try {
    await mkdir(inputDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    const file = formData.get('image') as File | null;

    if (!file) {
      return { ...prevState, error: 'No image file provided.', uploadProgress: null };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { ...prevState, error: 'Invalid file type. Only PNG, JPG, JPEG are allowed.', uploadProgress: null };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { ...prevState, error: 'File is too large. Maximum size is 5MB.', uploadProgress: null };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const originalFileExtension = path.extname(file.name) || `.${file.type.split('/')[1] || 'png'}`;
    const originalFilename = `${uuidv4()}${originalFileExtension}`;
    const originalPath = path.join(inputDir, originalFilename);
    originalPublicUrl = `/images-input/${originalFilename}`; // Assign here for use in catch block

    await writeFile(originalPath, fileBuffer);
    
    const originalImageDataUri = fileToDataUri(fileBuffer, file.type);
    
    const genkitInput: RemoveBackgroundInput = {
      imageDataUri: originalImageDataUri,
    };

    const genkitOutput = await removeBackground(genkitInput);

    if (!genkitOutput.processedImageDataUri) {
      return { ...prevState, error: 'Background removal failed. No processed image data returned.' , originalImageUrl: originalPublicUrl, uploadProgress: 100};
    }
    
    const { buffer: processedImageBuffer, mimeType: processedMimeType } = dataUriToBuffer(genkitOutput.processedImageDataUri);
    
    // Try to guess extension from mimeType, default to .png
    let processedFileExtension = '.png';
    if (processedMimeType.startsWith('image/')) {
        const typePart = processedMimeType.split('/')[1];
        if (typePart && ALLOWED_FILE_TYPES.map(t => t.split('/')[1]).includes(typePart)) {
            processedFileExtension = `.${typePart}`;
        }
    }
                                   
    const processedFilename = `${uuidv4()}-processed${processedFileExtension}`;
    const processedPath = path.join(outputDir, processedFilename);
    const processedPublicUrl = `/images-output/${processedFilename}`;

    await writeFile(processedPath, processedImageBuffer);
    
    return {
      message: 'Image processed successfully!',
      originalImageUrl: originalPublicUrl,
      processedImageUrl: processedPublicUrl,
      error: null,
      uploadProgress: 100,
    };
  } catch (error) {
    console.error('Error in uploadAndProcessImageServerAction:', error);
    let errorMessage = 'An unexpected error occurred during processing.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Return originalImageUrl if it was saved before the error
    return { ...prevState, error: errorMessage, originalImageUrl: originalPublicUrl, processedImageUrl: null, uploadProgress: null };
  }
}