// Lazy-load pdfjs to avoid bundling the worker unless needed
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Point the worker at the correct path — Vite copies it to /assets/
  // We use the legacy build (no worker-via-MessageChannel) which is simpler
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Each item has a `str` field; group by approximate Y position to preserve line order
    const items = content.items as Array<{ str: string; transform: number[] }>;
    if (items.length === 0) continue;

    // Sort by descending Y (top of page first), then ascending X
    const sorted = [...items].sort((a, b) => {
      const dy = b.transform[5] - a.transform[5];
      return Math.abs(dy) > 3 ? dy : a.transform[4] - b.transform[4];
    });

    // Group items into lines based on Y proximity
    const lines: string[][] = [];
    let lastY: number | null = null;
    for (const item of sorted) {
      const y = Math.round(item.transform[5]);
      if (lastY === null || Math.abs(y - lastY) > 3) {
        lines.push([]);
        lastY = y;
      }
      lines[lines.length - 1].push(item.str);
    }

    pageTexts.push(lines.map(l => l.join(' ')).join('\n'));
  }

  return pageTexts.join('\n\n');
}

// OCR via Tesseract.js — only imported when user uploads an image
export async function extractTextFromImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  // Lazy import to avoid bloating initial bundle
  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker(['chi_tra', 'eng'], 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });

  const url = URL.createObjectURL(file);
  const { data } = await worker.recognize(url);
  await worker.terminate();
  URL.revokeObjectURL(url);

  return data.text;
}
