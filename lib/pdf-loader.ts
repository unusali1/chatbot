// lib/pdf-loader.ts
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import axios from "axios";

export type PDFSource = { type: "url"; source: string }
 
export async function getChunkedDocsFromPDF(
  pdfSource: PDFSource
): Promise<Document[]> {
  let docs: Document[] = [];

  try {
    let loader: PDFLoader;

    switch (pdfSource.type) {
      case "url": {
        const res = await axios.get(pdfSource.source, {
          responseType: "arraybuffer",
          timeout: 30_000,
        });
        const blob = new Blob([res.data], { type: "application/pdf" });
        loader = new PDFLoader(blob);
        docs = await loader.load();
        break;
      }

      default:
        throw new Error(`Unsupported type: ${(pdfSource as any).type}`);
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });

    const chunks = await splitter.splitDocuments(docs);
    return chunks.filter((d) => d.pageContent.trim().length > 0);
  } catch (err) {
    console.error("PDF processing error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`PDF chunking failed: ${msg}`);
  }
}