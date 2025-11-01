"use server";

import { getChunkedDocsFromPDF, PDFSource } from "@/lib/pdf-loader";
import { embedAndStoreDocs } from "@/lib/vector-store";
import { getPineconeClient } from "@/lib/pinecone-client";

export async function prepare(source: PDFSource) {
  try {
    const pineconeClient = await getPineconeClient();
    console.log("Preparing chunks from PDF file");
    const docs = await getChunkedDocsFromPDF(source);
    console.log(`Loading ${docs.length} chunks into Pinecone...`);
    await embedAndStoreDocs(pineconeClient, docs);
    console.log("Data embedded and stored in Pinecone index");
    return docs.length;
  } catch (error) {
    console.error("Init client script failed ", error);
    throw new Error("Failed to prepare PDF");
  }
}

