'use server';

/**
 * @fileOverview Removes the background from an image using an external API.
 *
 * - removeBackground - A function that handles the background removal process.
 * - RemoveBackgroundInput - The input type for the removeBackground function.
 * - RemoveBackgroundOutput - The return type for the removeBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// path import removed as it's not used while the Genkit prompt is commented out.

const RemoveBackgroundInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to remove the background from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RemoveBackgroundInput = z.infer<typeof RemoveBackgroundInputSchema>;

const RemoveBackgroundOutputSchema = z.object({
  processedImageDataUri: z
    .string()
    .describe('The processed photo with the background removed, as a data URI.'),
});
export type RemoveBackgroundOutput = z.infer<typeof RemoveBackgroundOutputSchema>;

export async function removeBackground(input: RemoveBackgroundInput): Promise<RemoveBackgroundOutput> {
  return removeBackgroundFlow(input);
}

// This prompt definition is currently unused by the active external API logic path.
// It can be kept for potential future use with a Genkit multimodal model.
/*
const removeBackgroundPrompt = ai.definePrompt({
  name: 'removeBackgroundPrompt',
  input: {schema: RemoveBackgroundInputSchema},
  output: {schema: RemoveBackgroundOutputSchema},
  prompt: `You are an AI that removes the background from an image.

  Remove the background from the image provided.

  The original image is provided as a data URI.

  Image: {{media url=imageDataUri}}

  Return the processed image as a data URI.`, 
});
*/

const removeBackgroundFlow = ai.defineFlow(
  {
    name: 'removeBackgroundFlow',
    inputSchema: RemoveBackgroundInputSchema,
    outputSchema: RemoveBackgroundOutputSchema,
  },
  async (input: RemoveBackgroundInput): Promise<RemoveBackgroundOutput> => {
    // The ai.generate block for using Genkit/Gemini for background removal is commented out.
    // The current implementation uses an external API.
    /*
    const geminiResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', 
      prompt: [
        {media: {url: input.imageDataUri}},
        {
          text: 'Remove the background from this image, keeping the main subject in the foreground. Ensure the output is a high-quality image with a transparent background. If the image is a person, keep their hair and fine details intact. Return only the processed image.',
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
      }
    });

    if (!geminiResponse.media || !geminiResponse.media.url) {
      throw new Error('AI image processing failed to return an image.');
    }
    return { processedImageDataUri: geminiResponse.media.url };
    */

    // Logic to call the external background removal API
    const parts = input.imageDataUri.split(',');
    if (parts.length !== 2 || !parts[0].includes(';base64')) {
        console.error("Invalid Data URI format for input image in removeBackgroundFlow. URI start:", input.imageDataUri.substring(0,100));
        throw new Error('Internal error: Invalid image data format before API call.');
    }
    const meta = parts[0];
    const base64Data = parts[1];
    
    const mimeTypeMatch = meta.match(/:(.*?);/);
    const mimeType = mimeTypeMatch && mimeTypeMatch[1] ? mimeTypeMatch[1] : 'application/octet-stream';
    
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const formData = new FormData();
    const fileExtension = mimeType.startsWith('image/') ? `.${mimeType.split('/')[1]}` : '.png';
    formData.append('image', new Blob([imageBuffer], { type: mimeType }), `input-image${fileExtension}`);

    let apiResponse;
    try {
      apiResponse = await fetch(
        'http://ec2-34-254-248-103.eu-west-1.compute.amazonaws.com:3001/remove-background/link',
        {
          method: 'POST',
          body: formData,
        },
      );
    } catch (e: any) {
        const errorMessage = e.message ? e.message.substring(0,1000) : String(e).substring(0,1000);
        console.error("Error connecting to external background removal API:", errorMessage);
        throw new Error(`Failed to connect to background removal service. Please check network or API status.`);
    }
    
    const responseBodyText = await apiResponse.text().catch(async (textErr: any) => {
        const errorMsg = textErr.message ? textErr.message.substring(0,500) : String(textErr).substring(0,500);
        console.error("Could not read response body from external API:", apiResponse.status, errorMsg);
        throw new Error(`Background removal service responded (status ${apiResponse.status}) but body was unreadable.`);
    });

    if (!apiResponse.ok) {
      console.error("External background removal API Error:", apiResponse.status, responseBodyText.substring(0, 1000));
      throw new Error(`Background removal service failed (status ${apiResponse.status}). Details: ${responseBodyText.substring(0, 300)}`);
    }

    let result;
    try {
        result = JSON.parse(responseBodyText);
    } catch (e: any) {
        console.error("Failed to parse JSON from external background removal API. Response text:", responseBodyText.substring(0,1000));
        throw new Error(`Background removal service returned an unexpected response. Preview: ${responseBodyText.substring(0, 200)}`);
    }
    

    if (result.data && result.data.url) {
      const processedImageExternalUrl = result.data.url;
      
      let imageFetchResponse;
      try {
        imageFetchResponse = await fetch(processedImageExternalUrl);
      } catch (e: any) {
        const errorMsg = e.message ? e.message.substring(0,1000) : String(e).substring(0,1000);
        console.error(`Error connecting to fetch processed image from URL: ${processedImageExternalUrl}`, errorMsg);
        throw new Error(`Failed to connect to retrieve processed image. Check network or image URL.`);
      }

      if (!imageFetchResponse.ok) {
        const errorBodyText = await imageFetchResponse.text().catch(() => `Status ${imageFetchResponse.statusText || imageFetchResponse.status}`);
        console.error(`Failed to fetch processed image from ${processedImageExternalUrl}: ${imageFetchResponse.status}`, errorBodyText.substring(0, 1000));
        throw new Error(`Failed to retrieve processed image (status ${imageFetchResponse.status}). Resource: ${processedImageExternalUrl.substring(0,100)}...`);
      }
      
      let fetchedImageArrayBuffer;
      try {
        fetchedImageArrayBuffer = await imageFetchResponse.arrayBuffer();
      } catch (e: any) {
         const errorMsg = e.message ? e.message.substring(0,1000) : String(e).substring(0,1000);
        console.error(`Error reading arrayBuffer from fetched image: ${processedImageExternalUrl}`, errorMsg);
        throw new Error(`Failed to read data from processed image. Resource: ${processedImageExternalUrl.substring(0,100)}...`);
      }

      const fetchedImageBuffer = Buffer.from(fetchedImageArrayBuffer);
      const fetchedMimeType = imageFetchResponse.headers.get('content-type') || 'image/png';

      const processedImageDataUri = `data:${fetchedMimeType};base64,${fetchedImageBuffer.toString('base64')}`;
      
      return { processedImageDataUri: processedImageDataUri };
    } else {
      console.error("Invalid API response structure from external background removal service:", JSON.stringify(result).substring(0,1000));
      throw new Error('Background removal service returned invalid data or missing URL.');
    }
  }
);
