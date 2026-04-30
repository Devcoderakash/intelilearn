
/**
 * Dynamic Script Loader for CDN dependencies
 */
async function loadScript(url: string, globalName: string): Promise<any> {
    if (typeof window === 'undefined') return null;
    // @ts-ignore
    if (window[globalName]) return window[globalName];

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        
        // Timeout to prevent hanging
        const timeout = setTimeout(() => {
            reject(new Error(`Load timeout for ${globalName} from ${url}`));
        }, 15000);

        script.onload = () => {
            clearTimeout(timeout);
            // Polling briefly to ensure global registration
            let attempts = 0;
            const check = setInterval(() => {
                // @ts-ignore
                if (window[globalName]) {
                    clearInterval(check);
                    // @ts-ignore
                    resolve(window[globalName]);
                }
                if (attempts++ > 10) {
                    clearInterval(check);
                    reject(new Error(`${globalName} global not found after script load`));
                }
            }, 100);
        };
        script.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`Failed to load script: ${url}`));
        };
        document.head.appendChild(script);
    });
}

async function extractTextFromPDF(file: File): Promise<string> {
    // Switching to 3.x series which is more stable for global script loading
    const PDF_VER = "3.11.174";
    const pdfjsLib = await loadScript(`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_VER}/pdf.min.js`, 'pdfjsLib');
    if (!pdfjsLib) throw new Error("PDF.js library failed to initialize");

    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_VER}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // @ts-ignore
        text += textContent.items.map(item => item.str).join(' ') + '\n';
    }
    
    return text;
}

async function extractTextFromImage(file: File): Promise<string> {
    const Tesseract = await loadScript('https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js', 'Tesseract');
    if (!Tesseract) throw new Error("Tesseract.js failed to load");

    const result = await Tesseract.recognize(file, 'eng');
    return result.data.text;
}

async function extractTextFromDocx(file: File): Promise<string> {
    const mammoth = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js', 'mammoth');
    if (!mammoth) throw new Error("Mammoth.js failed to load");

    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

export async function extractText(file: File): Promise<string> {
  const type = file.type;
  
  try {
    if (type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return await extractTextFromPDF(file);
    } else if (type.startsWith('image/')) {
      return await extractTextFromImage(file);
    } else if (type.includes('wordprocessingml.document') || file.name.endsWith('.docx')) {
      return await extractTextFromDocx(file);
    } else if (type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      return await file.text();
    } else {
      throw new Error('Unsupported format: ' + (type || 'unknown'));
    }
  } catch (error: any) {
    console.error("Extraction failed:", error);
    throw new Error(`Failed to extract text from ${file.name}: ${error.message}`);
  }
}
