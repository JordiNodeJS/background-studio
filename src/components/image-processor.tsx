
'use client';

import React, { useState, useEffect, useActionState, useTransition } from 'react';
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
  uploadProgress: null,
};

export default function ImageProcessor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [clientUploadProgress, setClientUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();
  
  const [state, formAction, isActionFormPending] = useActionState<ActionState, FormData>(
    uploadAndProcessImageServerAction,
    initialState
  );
  // const [isTransitionPending, startTransition] = useTransition();


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
      setClientUploadProgress(null); // Reset progress on error
    }

    setOriginalImage(state?.originalImageUrl || null);
    setProcessedImage(state?.processedImageUrl || null);

    if (state?.uploadProgress === 100 && !state.error) {
      setClientUploadProgress(100); // Sync with server state
    } else if (state?.error) {
      setClientUploadProgress(null);
    }
    // if isActionFormPending becomes false and there was an error, reset progress
    if (!isActionFormPending && state?.error) {
        setClientUploadProgress(null);
    }

  }, [state, toast, isActionFormPending]);
  
  // Reset progress if form is cleared or initial state
  useEffect(() => {
    if (!originalImage && !processedImage && !state?.error && !isActionFormPending) {
        setClientUploadProgress(null);
    }
  }, [originalImage, processedImage, state?.error, isActionFormPending]);

  const showUploadForm = !isActionFormPending || (clientUploadProgress !== null && clientUploadProgress < 100);
  const showProcessingSpinner = isActionFormPending && (clientUploadProgress === 100 || clientUploadProgress === null); // Show processing spinner if upload is done or wasn't tracked by client

  return (
    <div className="space-y-8">
      {showUploadForm && (
        <Card className="shadow-xl overflow-hidden border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Upload Your Image</CardTitle>
            <CardDescription>Select an image file (PNG, JPG, JPEG) up to 5MB. The background will be magically erased!</CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm 
              formAction={formAction} 
              isActionFormPending={isActionFormPending} 
              uploadProgress={clientUploadProgress}
              setUploadProgress={setClientUploadProgress}
            />
          </CardContent>
        </Card>
      )}

      {showProcessingSpinner && (
        <div className="flex flex-col justify-center items-center p-12 space-y-4 bg-card rounded-lg shadow-md min-h-[300px] border border-border">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-xl font-medium text-foreground">Processing Image...</p>
          <p className="text-muted-foreground text-center max-w-md">The AI is working its magic. This might take a few moments.</p>
          <Progress value={undefined} className="w-3/4 max-w-xs mt-4 h-2.5 animate-pulse" /> {/* Indeterminate progress for processing */}
        </div>
      )}

      {state?.error && !isActionFormPending && (
         <Alert variant="destructive" className="shadow-md">
          <ImageOff className="h-5 w-5" />
          <AlertTitle className="font-semibold">Processing Failed</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {originalImage && processedImage && !isActionFormPending && !state?.error && (
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
