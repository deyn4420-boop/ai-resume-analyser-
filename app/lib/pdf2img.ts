export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  loadPromise = Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]).then(([lib, workerSrc]) => {
    lib.GlobalWorkerOptions.workerSrc = workerSrc.default;
    pdfjsLib = lib;
    return lib;
  });

  return loadPromise;
}

async function renderFirstPageToImageFile(
  page: any,
  file: File
): Promise<PdfConversionResult> {
  const viewport = page.getViewport({ scale: 4 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return {
      imageUrl: "",
      file: null,
      error: "Canvas is not supported in this browser",
    };
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  await page.render({ canvasContext: context, viewport }).promise;

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const originalName = file.name.replace(/\.pdf$/i, "");
          const imageFile = new File([blob], `${originalName}.png`, {
            type: "image/png",
          });

          resolve({
            imageUrl: URL.createObjectURL(blob),
            file: imageFile,
          });
        } else {
          resolve({
            imageUrl: "",
            file: null,
            error: "Failed to create image blob",
          });
        }
      },
      "image/png",
      1.0
    );
  });
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const pdf = await lib.getDocument({ data }).promise;
    const page = await pdf.getPage(1);

    return renderFirstPageToImageFile(page, file);
  } catch (err) {
    console.warn("PDF worker conversion failed, retrying without worker", err);

    try {
      const lib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const pdf = await lib.getDocument({ data, disableWorker: true }).promise;
      const page = await pdf.getPage(1);

      return renderFirstPageToImageFile(page, file);
    } catch (fallbackErr) {
      console.error("Failed to convert PDF to image", fallbackErr);

      return {
        imageUrl: "",
        file: null,
        error:
          fallbackErr instanceof Error
            ? fallbackErr.message
            : `Failed to convert PDF: ${fallbackErr}`,
      };
    }
  }
}
