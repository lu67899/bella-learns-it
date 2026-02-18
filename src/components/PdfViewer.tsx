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

  // Re-render on resize
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
      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-muted-foreground min-w-[60px] text-center">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-muted-foreground min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/20 flex justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
    </div>
  );
};

export default PdfViewer;
