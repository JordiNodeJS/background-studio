'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2, UploadCloud, XCircle, CheckCircle } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface UploadFormProps {
  formAction: (formData: FormData) => void; // Server action from useActionState
  isActionFormPending: boolean; // Pending state from useActionState
  uploadProgress: number | null;
  setUploadProgress: (progress: number | null) => void;
}

export default function UploadForm({ formAction, isActionFormPending, uploadProgress, setUploadProgress }: UploadFormProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setUploadProgress(null);
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setFileError('Invalid file type. Please select a PNG, JPG, or JPEG image.');
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFileName(null);
        setPreviewUrl(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setFileError('File is too large. Maximum size is 5MB.');
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFileName(null);
        setPreviewUrl(null);
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFileName(null);
      setPreviewUrl(null);
    }
  };

  const handleReset = (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e?.preventDefault();
    setFileName(null);
    setPreviewUrl(null);
    setFileError(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // Client-side validation
    if (!fileInputRef.current?.files?.[0]) {
      setFileError("Please select a file to upload.");
      event.preventDefault(); // Prevent form submission
      return;
    }
    if (fileError) { // If there's an existing file error (e.g. type/size)
        event.preventDefault(); // Prevent form submission
        return;
    }

    setFileError(null);

    // Start client-side progress simulation
    // This will run before the form action actually starts if validation passes
    let currentProgress = 0;
    setUploadProgress(currentProgress);
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress <= 90) {
        setUploadProgress(currentProgress);
      } else {
        clearInterval(interval); // Stop client simulation at 90%
      }
    }, 100);

    // If validations pass, do not call event.preventDefault().
    // The form will submit using its 'action' prop, triggering the server action.
  };

  return (
    <form action={formAction} onSubmit={handleFormSubmit} className="space-y-6">
      <div>
        <Label
          htmlFor="image-upload"
          className={cn(
            "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors relative",
            (isActionFormPending || (uploadProgress !== null && uploadProgress < 100)) ? "cursor-not-allowed bg-muted/30" : "hover:border-primary",
            previewUrl ? "border-solid !border-primary p-0" : "border-border hover:bg-muted/20"
          )}
        >
          {previewUrl && !(uploadProgress !== null && uploadProgress < 100 && !isActionFormPending) && (
            <div className="relative w-full h-full">
              <img src={previewUrl} alt="Selected preview" className="object-contain w-full h-full rounded-lg" />
              {!(isActionFormPending || (uploadProgress !== null && uploadProgress < 100)) && <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/70 hover:bg-background rounded-full p-1"
                onClick={handleReset}
                aria-label="Clear image"
              >
                <XCircle className="h-6 w-6 text-destructive hover:text-destructive/80" />
              </Button>}
            </div>
          )}
          {!(previewUrl && !(uploadProgress !== null && uploadProgress < 100 && !isActionFormPending)) && (uploadProgress === null || uploadProgress >= 100 || isActionFormPending) && (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (MAX. 5MB)</p>
            </div>
          )}
          {uploadProgress !== null && uploadProgress < 100 && !isActionFormPending && ( // Show client progress only if server action is not yet pending
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg p-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium text-foreground">Uploading...</p>
              <Progress value={uploadProgress} className="w-3/4 max-w-xs mt-2 h-2.5" />
              <p className="text-sm text-muted-foreground mt-1">{uploadProgress}%</p>
            </div>
          )}
           {/* Server is processing, isActionFormPending is true, client progress might be at 90 or 100 if server responded quickly */}
          {isActionFormPending && (uploadProgress !== null && uploadProgress >=90) && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg p-4">
                {/* This state is handled by ImageProcessor's main spinner - this part might be redundant or could show "Finalizing" */}
             </div>
          )}
          {uploadProgress === 100 && !isActionFormPending && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg p-4">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-foreground">Uploaded!</p>
              <p className="text-sm text-muted-foreground mt-1">Ready for processing / Processed.</p>
            </div>
          )}
          <Input
            id="image-upload"
            name="image" // Name attribute is crucial for FormData when using form action
            type="file"
            accept=".png,.jpeg,.jpg"
            required
            className="sr-only"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isActionFormPending || (uploadProgress !== null && uploadProgress < 100)}
          />
        </Label>
        {fileError && <p className="mt-2 text-sm text-destructive">{fileError}</p>}
        {fileName && !previewUrl && !fileError && <p className="mt-2 text-sm text-muted-foreground">Selected file: {fileName}</p>}
      </div>
      <div className="flex items-center space-x-4">
        <Button
          type="submit"
          disabled={isActionFormPending || !fileName || !!fileError || (uploadProgress !== null && uploadProgress < 100 && !isActionFormPending)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[200px] py-3 text-base"
        >
          {isActionFormPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-5 w-5" />
              Upload & Erase
            </>
          )}
        </Button>
        {fileName && !(isActionFormPending || (uploadProgress !== null && uploadProgress < 100)) && (
          <Button type="button" variant="outline" onClick={handleReset}>
            Clear Selection
          </Button>
        )}
      </div>
    </form>
  );
}