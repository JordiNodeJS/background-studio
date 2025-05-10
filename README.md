
# Background Eraser Pro

Background Eraser Pro is a Next.js 15 application that allows users to upload images, remove their backgrounds using an AI model, and compare the original image with the processed one using a side-by-side slider.

This application is built with Next.js App Router, Server Actions, and Genkit for AI processing, featuring a professionally designed UI.

## Core Features

- **Image Upload**: Users can upload images (PNG, JPG, JPEG, up to 5MB) from their local device with client-side validation and preview.
- **AI Background Removal**: Uploaded images are processed by a Genkit AI flow (utilizing Google AI) to remove the background.
- **Image Comparison**: A visual interface displays the original and processed images side-by-side with a draggable slider for easy comparison. The comparison view dynamically adjusts to the aspect ratio of the uploaded image.
- **Toast Notifications**: Users receive clear feedback on the success or failure of operations through toast notifications.
- **Responsive Design**: The application is designed to work seamlessly across various devices and screen sizes.

## Tech Stack

- Next.js 15 (App Router)
- React 18 (using `useFormState` and `useTransition`)
- TypeScript
- Tailwind CSS (with ShadCN UI components for a polished look and feel)
- Genkit (for AI flow integration)
- Lucide Icons (for crisp, outline-style iconography)
- UUID (for generating unique filenames)

## Getting Started

### Prerequisites

- Node.js (version 18.x or later recommended)
- npm or yarn

### Installation

1.  **Clone the repository (if applicable) or ensure you have the project files.**

2.  **Navigate to the project directory:**
    ```bash
    cd your-project-name 
    ```
    (Replace `your-project-name` with the actual directory name)

3.  **Install dependencies:**
    ```bash
    npm install
    ```
    or if you prefer yarn:
    ```bash
    yarn install
    ```

### Environment Variables

This application uses Genkit with Google AI (Gemini models). You will need to configure Google Cloud credentials for your environment. Typically, this involves:
1. Authenticating with `gcloud`: `gcloud auth application-default login`
2. Ensuring your Google Cloud project has the Vertex AI API enabled and appropriate billing set up.

If your Genkit setup requires a specific API key (though Application Default Credentials are often preferred for server-side applications), create a `.env` file in the root of your project:
```env
# Example: If using a specific Google API Key for Genkit with Google AI
# GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY 
```
The `src/ai/dev.ts` file uses `dotenv` to load these variables if present. Refer to Genkit and Google AI documentation for detailed setup.

### Running the Development Server

To start the Next.js development server:

```bash
npm run dev
```

This will typically start the application on `http://localhost:9002` (as configured in `package.json`). Open this URL in your browser.

The Genkit flows are integrated directly into the Next.js application via Server Actions. The Next.js development server (`npm run dev`) is sufficient to run and test the complete application, including the AI background removal functionality.
For specific Genkit flow development or testing, you can use:
```bash
npm run genkit:dev
```
Or with file watching:
```bash
npm run genkit:watch
```

## Project Structure

```
/app
  /components
    ImageComparison.tsx     # Component for side-by-side image comparison with a draggable slider
    ImageProcessor.tsx      # Client component managing overall state, Server Action calls, and UI updates
    UploadForm.tsx          # Client component for image selection, preview, and form submission
  /lib
    actions.ts              # Server Actions handling image processing, Genkit calls, and file I/O
  page.tsx                  # Main (home) page of the application
/public
  /images-input             # Directory where original uploaded images are saved
  /images-output            # Directory where AI-processed (background-removed) images are saved
/src
  /ai
    /flows
      remove-background.ts  # Genkit AI flow that performs the background removal
    dev.ts                  # Genkit development server entry point (for standalone Genkit dev)
    genkit.ts               # Genkit core configuration and plugin setup
  ... (other standard Next.js files, ShadCN UI components, hooks, etc.)
```

## Background Removal Process

1.  The user selects an image through the `UploadForm.tsx` component. Client-side validation (file type, size) occurs.
2.  Upon submission, the form data is passed to a Server Action (`uploadAndProcessImageServerAction` in `actions.ts`).
3.  The Server Action:
    a.  Validates the file again on the server.
    b.  Saves the original image to the `public/images-input/` directory.
    c.  Converts the image to a data URI.
    d.  Calls the `removeBackground` Genkit flow (from `src/ai/flows/remove-background.ts`) with the image data URI.
    e.  The Genkit flow uses a Google AI model (e.g., Gemini) to remove the background.
    f.  Receives the processed image as a data URI from the Genkit flow.
    g.  Decodes the processed image data URI and saves it to the `public/images-output/` directory.
    h.  Returns URLs for both the original and processed images (or an error message) to the client.
4.  The `ImageProcessor.tsx` component receives the result from the Server Action, updates its state, and displays toast notifications.
5.  If successful, the `ImageComparison.tsx` component is rendered, showing both images with the interactive slider.

## Notes

-   **File System**: The application writes images to the `public` directory. In a Vercel deployment or similar serverless environments, the `public` directory is part of the build output and typically not writable at runtime for persistent storage. For persistent storage in such environments, a dedicated file storage service (like Firebase Storage, AWS S3, etc.) would be required. This starter assumes a local development environment or a server environment where the `public` folder is writable.
-   **Error Handling**: Basic error handling is implemented, with messages displayed via toasts.
-   **Styling**: The application uses Tailwind CSS and ShadCN UI components, adhering to the professional design specifications provided (neutral grays, soft blues, teal accents).
