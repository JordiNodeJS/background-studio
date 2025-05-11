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
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-exp',

      // simple prompt
      prompt: [{media: {url: input.imageDataUri}}, {text: 'A high-quality image of a subject (person, object, etc.) on a diverse or complex background. Remove the background completely and precisely, leaving only the subject with a transparent background. The subject should be clearly defined and all remnants of the original background should be eliminated. **The output image must retain the exact dimensions (width and height) of the original input image.**'}],
      // OR, existing images can be provided in-context for editing, character reuse, etc.
      // prompt: [
      //   {media: {url: 'data:<mime_type>;base64,<b64_encoded_image>'}},
      //   {text: 'generate an image of this character in a jungle'},
      // ],

      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    return {processedImageDataUri: media.url!};
  }
);
