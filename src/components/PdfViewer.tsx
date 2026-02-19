import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
  title: string;
}

const PdfViewer = ({ url, title }: PdfViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Swipe state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goNext = useCallback(() => {
    if (page < totalPages) {
      setIsAnimating(true);
      setSwipeDelta(-window.innerWidth);
      setTimeout(() => {
        setPage((p) => Math.min(totalPages, p + 1));
        setSwipeDelta(0);
        setIsAnimating(false);
      }, 200);
    }
  }, [page, totalPages]);

  const goPrev = useCallback(() => {
    if (page > 1) {
      setIsAnimating(true);
      setSwipeDelta(window.innerWidth);
      setTimeout(() => {
        setPage((p) => Math.max(1, p - 1));
        setSwipeDelta(0);
        setIsAnimating(false);
      }, 200);
    }
  }, [page]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setSwipeDelta(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      if (scale > 1 && containerRef.current) {
        const el = containerRef.current;
        const atLeft = el.scrollLeft <= 1;
        const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
        // Only allow swipe delta if at scroll edge in swipe direction
        if ((dx > 0 && atLeft) || (dx < 0 && atRight)) {
          setSwipeDelta(dx);
        }
      } else {
        setSwipeDelta(dx);
      }
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;
    const threshold = 60;
    if (swipeDelta < -threshold) {
      goNext();
    } else if (swipeDelta > threshold) {
      goPrev();
    } else {
      setSwipeDelta(0);
    }
    touchStartRef.current = null;
  }, [swipeDelta, goNext, goPrev, scale]);

  // Tap on left/right side to navigate
  const handleTap = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const zone = rect.width * 0.25;
    if (x < zone) goPrev();
    else if (x > rect.width - zone) goNext();
  }, [goNext, goPrev]);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const doc = await loadingTask.promise;
        if (!cancelled) {
          setPdf(doc);
          setTotalPages(doc.numPages);
          setPage(1);
        }
      } catch (e) {
        console.error("PDF load error:", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [url]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current || !containerRef.current) return;

    try {
      const pdfPage = await pdf.getPage(page);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const containerWidth = containerRef.current.clientWidth;
      const viewport = pdfPage.getViewport({ scale: 1 });
      const fitScale = containerWidth / viewport.width;
      const finalScale = fitScale * scale;
      const scaledViewport = pdfPage.getViewport({ scale: finalScale });

      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = scaledViewport.width * pixelRatio;
      canvas.height = scaledViewport.height * pixelRatio;
      canvas.style.width = `${scaledViewport.width}px`;
      canvas.style.height = `${scaledViewport.height}px`;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      await pdfPage.render({
        canvasContext: ctx,
        viewport: scaledViewport,
      }).promise;
    } catch (e) {
      console.error("PDF render error:", e);
    }
  }, [pdf, page, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  useEffect(() => {
    const handleResize = () => renderPage();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderPage]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-muted-foreground font-mono text-center">
          Não foi possível abrir o PDF no app.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-mono"
        >
          <Download className="h-4 w-4" />
          Baixar PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Compact top bar: page indicator + zoom */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/50 shrink-0">
        <span className="text-xs font-mono text-muted-foreground">
          {page} / {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] font-mono text-muted-foreground min-w-[32px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas with swipe + tap zones */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/20 flex justify-center relative select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full"
          style={{
            transform: `translateX(${swipeDelta}px)`,
            transition: isAnimating ? "transform 0.2s ease-out" : "none",
          }}
        />

        {/* Visual swipe hint arrows (show on edges) */}
        {page > 1 && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 h-12 w-6 rounded-r-full bg-foreground/5 flex items-center justify-center pointer-events-none">
            <ChevronLeft className="h-4 w-4 text-muted-foreground/40" />
          </div>
        )}
        {page < totalPages && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 h-12 w-6 rounded-l-full bg-foreground/5 flex items-center justify-center pointer-events-none">
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
