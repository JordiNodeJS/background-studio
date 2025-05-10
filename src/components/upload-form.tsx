
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2, UploadCloud, XCircle } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface UploadFormProps {
  formAction: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

export default function UploadForm({ formAction, isPending }: UploadFormProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type on client side for quick feedback
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please select a PNG, JPG, or JPEG image.');
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset input
        return;
      }
      // Validate file size
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('File is too large. Maximum size is 5MB.');
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset input
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
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
    }
  }

  return (
    <form onSubmit={formAction} className="space-y-6">
      <div>
        <Label 
          htmlFor="image-upload" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors relative",
            isPending ? "cursor-not-allowed bg-muted/30" : "hover:border-primary",
            previewUrl ? "border-solid !border-primary p-0" : "border-border hover:bg-muted/20"
          )}
        >
          {previewUrl ? (
            <div className="relative w-full h-full">
              <img src={previewUrl} alt="Selected preview" className="object-contain w-full h-full rounded-lg" />
               {!isPending && <Button 
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
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (MAX. 5MB)</p>
            </div>
          )}
          <Input
            id="image-upload"
            name="image"
            type="file"
            accept=".png,.jpeg,.jpg"
            required
            className="sr-only" // Visually hidden, triggered by label
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isPending}
          />
        </Label>
        {fileName && !previewUrl && <p className="mt-2 text-sm text-muted-foreground">Selected file: {fileName}</p>}
      </div>
      <div className="flex items-center space-x-4">
        <Button type="submit" disabled={isPending || !fileName} className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[200px] py-3 text-base">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Working...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-5 w-5" />
              Upload & Erase
            </>
          )}
        </Button>
        {fileName && !isPending && (
            <Button type="button" variant="outline" onClick={() => handleReset()}>
                Clear Selection
            </Button>
        )}
      </div>
    </form>
  );
}

