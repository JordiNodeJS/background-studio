
import ImageProcessor from '@/components/image-processor';
import { Sparkles } from 'lucide-react'; // Changed icon to Sparkles for a more "magical" feel

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8 md:px-8 md:py-12 min-h-screen">
      <header className="mb-8 md:mb-12 text-center">
        <div className="inline-flex items-center justify-center bg-accent/10 text-accent p-4 rounded-full mb-6 shadow-sm">
            <Sparkles className="h-12 w-12" strokeWidth={1.5}/>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
          Background Eraser <span className="text-accent">Pro</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Effortlessly remove image backgrounds with our AI-powered tool. Upload, process, and compare in seconds.
        </p>
      </header>
      <ImageProcessor />
      <footer className="text-center mt-16 mb-8 py-6 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          Powered by Next.js & Genkit AI. An expert-designed application.
        </p>
      </footer>
    </main>
  );
}
