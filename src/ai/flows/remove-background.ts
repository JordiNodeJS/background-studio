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

const removeBackgroundFlow = ai.defineFlow(
  {
    name: 'removeBackgroundFlow',
    inputSchema: RemoveBackgroundInputSchema,
    outputSchema: RemoveBackgroundOutputSchema,
  },
  async input => {
    //TODO: Call an external API to remove the background from the image.
    //For now, just return the original image.
    // const {output} = await removeBackgroundPrompt(input);
    // return output!;

    const {media} = await ai.generate({
      prompt: [
        {media: {url: input.imageDataUri}},
        {
          text: 'Remove the background from this image, keeping the main subject in the foreground. Ensure the output is a high-quality image with a transparent background. If the image is a person, keep their hair and fine details intact.',
        },
      ],
    });

    const formData = new FormData();
    // Assuming the data URI is for a PNG. You might need to extract the actual mime type.
    const byteCharacters = atob(input.imageDataUri.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    formData.append('image', new Blob([byteArray], {type: 'image/png'}), 'input-01.png');

    const response = await fetch(
      'http://ec2-34-254-248-103.eu-west-1.compute.amazonaws.com:3001/remove-background/link',
      {
        method: 'POST',
        body: formData,
        headers: {
          // The 'Content-Type' header is automatically set to 'multipart/form-data'
          // when using FormData.
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();

    // Assuming the response structure is { data: { url: "..." } }
    if (result.data && result.data.url) {
      // You might need to fetch the image data from the URL if you need a data URI
      // For now, we'll return the URL directly in a new property
      return {processedImageUrl: result.data.url} as any; // Need to adjust output schema
    } else {
      throw new Error('Invalid response format from the API.');
    }
  }
);
