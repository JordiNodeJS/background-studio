
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2, UploadCloud, XCircle, CheckCircle } from 'lucide-react';
import React, { useRef, useState, useEffect, useTransition } from 'react';
import { Progress } from '@/components/ui/progress';

interface UploadFormProps {
  formAction: (formData: FormData) => void;
  isActionFormPending: boolean;
  uploadProgress: number | null;
  setUploadProgress: (progress: number | null) => void;
}

export default function UploadForm({ formAction, isActionFormPending, uploadProgress, setUploadProgress }: UploadFormProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isClientTransitionPending, startClientTransition] = useTransition();

  const combinedIsPending = isActionFormPending || isClientTransitionPending;

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      setFileError("Please select a file to upload.");
      return;
    }
    setFileError(null); 

    let currentProgress = 0;
    setUploadProgress(currentProgress);
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress <= 90) { 
        setUploadProgress(currentProgress);
      } else {
        clearInterval(interval);
      }
    }, 100); 

    const formData = new FormData(event.currentTarget);
    startClientTransition(() => {
      formAction(formData);
    });
  };
  
  useEffect(() => {
    if (isActionFormPending && uploadProgress !== null && uploadProgress >= 90) {
      // Waiting for server response
    } else if (!isActionFormPending && uploadProgress === 100) {
      // Server action completed successfully
    } 
  }, [isActionFormPending, uploadProgress, fileName]);


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label 
          htmlFor="image-upload" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors relative",
            combinedIsPending || (uploadProgress !== null && uploadProgress < 100) ? "cursor-not-allowed bg-muted/30" : "hover:border-primary",
            previewUrl ? "border-solid !border-primary p-0" : "border-border hover:bg-muted/20"
          )}
        >
          {previewUrl && !(uploadProgress !== null && uploadProgress < 100 && !isActionFormPending) && ( 
            <div className="relative w-full h-full">
              <img src={previewUrl} alt="Selected preview" className="object-contain w-full h-full rounded-lg" />
               {!(combinedIsPending || (uploadProgress !== null && uploadProgress < 100)) && <Button 
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
          {!(previewUrl && !(uploadProgress !== null && uploadProgress < 100 && !isActionFormPending)) && (uploadProgress === null || uploadProgress >=100 || isActionFormPending) && (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (MAX. 5MB)</p>
            </div>
          )}
          {uploadProgress !== null && uploadProgress < 100 && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium text-foreground">Uploading...</p>
                <Progress value={uploadProgress} className="w-3/4 max-w-xs mt-2 h-2.5" />
                <p className="text-sm text-muted-foreground mt-1">{uploadProgress}%</p>
             </div>
          )}
          {uploadProgress === 100 && !isActionFormPending && !isClientTransitionPending && ( 
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg p-4">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium text-foreground">Uploaded!</p>
                <p className="text-sm text-muted-foreground mt-1">Preparing for processing...</p>
            </div>
          )}


          <Input
            id="image-upload"
            name="image"
            type="file"
            accept=".png,.jpeg,.jpg"
            required
            className="sr-only"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={combinedIsPending || (uploadProgress !== null && uploadProgress < 100)}
          />
        </Label>
        {fileError && <p className="mt-2 text-sm text-destructive">{fileError}</p>}
        {fileName && !previewUrl && !fileError && <p className="mt-2 text-sm text-muted-foreground">Selected file: {fileName}</p>}
      </div>
      <div className="flex items-center space-x-4">
        <Button 
          type="submit" 
          disabled={combinedIsPending || !fileName || !!fileError || (uploadProgress !== null && uploadProgress < 100)} 
          className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[200px] py-3 text-base"
        >
          {(() => {
            if (isActionFormPending || isClientTransitionPending) {
                 return (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                    </>
                );
            }
            return (
                 <>
                    <UploadCloud className="mr-2 h-5 w-5" />
                    Upload & Erase
                 </>
            );
          })()}
        </Button>
        {fileName && !(combinedIsPending || (uploadProgress !== null && uploadProgress < 100)) && (
            <Button type="button" variant="outline" onClick={handleReset}>
                Clear Selection
            </Button>
        )}
      </div>
    </form>
  );
}
