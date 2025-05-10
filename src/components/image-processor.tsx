
'use client';

import React, { useState, useTransition, useEffect, useActionState } from 'react';
import { uploadAndProcessImageServerAction, type ActionState } from '@/lib/actions';
import UploadForm from '@/components/upload-form';
import ImageComparison from '@/components/image-comparison';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImageOff, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from '@/components/ui/progress';

const initialState: ActionState = {
  originalImageUrl: null,
  processedImageUrl: null,
  error: null,
  message: null,
};

export default function ImageProcessor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [state, formAction] = useActionState<ActionState, FormData>(
    uploadAndProcessImageServerAction,
    initialState
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.message) {
      toast({
        title: 'Success!',
        description: state.message,
        action: <CheckCircle2 className="text-green-500" />,
      });
    }
    if (state?.error) {
      toast({
        title: 'Error!',
        description: state.error,
        variant: 'destructive',
      });
    }

    // Always update images based on the latest server action state
    setOriginalImage(state?.originalImageUrl || null);
    setProcessedImage(state?.processedImageUrl || null);

  }, [state, toast]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="space-y-8">
      {!isPending && (
        <Card className="shadow-xl overflow-hidden border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Upload Your Image</CardTitle>
            <CardDescription>Select an image file (PNG, JPG, JPEG) up to 5MB. The background will be magically erased!</CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm formAction={handleSubmit} isPending={isPending} />
          </CardContent>
        </Card>
      )}

      {isPending && (
        <div className="flex flex-col justify-center items-center p-12 space-y-4 bg-card rounded-lg shadow-md min-h-[300px] border border-border">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-xl font-medium text-foreground">Uploading &amp; Processing...</p>
          <p className="text-muted-foreground text-center max-w-md">Your image is being uploaded and processed. This might take a moment, please wait.</p>
          <Progress value={50} className="w-3/4 max-w-xs mt-4 h-2.5 animate-pulse" />
        </div>
      )}

      {state?.error && !isPending && (
         <Alert variant="destructive" className="shadow-md">
          <ImageOff className="h-5 w-5" />
          <AlertTitle className="font-semibold">Processing Failed</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {originalImage && processedImage && !isPending && (
        <Card className="shadow-xl overflow-hidden border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Compare Images</CardTitle>
            <CardDescription>Slide the handle to compare the original and background-erased images.</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6">
            <ImageComparison
              originalImageUrl={originalImage}
              processedImageUrl={processedImage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

