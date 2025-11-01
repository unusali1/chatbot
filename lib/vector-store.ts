// lib/vector-store.ts
import { env } from '@/lib/config';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { Document } from '@langchain/core/documents';
import { embedTexts } from './embeddings';
import { EmbeddingsInterface } from "@langchain/core/embeddings";
import { PineconeStore } from "@langchain/pinecone";
import { v4 as uuidv4 } from "uuid";

/**
 * Custom Embeddings class using Xenova transformer model
 */
class CustomEmbeddings implements EmbeddingsInterface {
  async embedDocuments(texts: string[]) {
    return await embedTexts(texts);
  }

  async embedQuery(text: string) {
    const [embedding] = await embedTexts([text]);
    return embedding;
  }
}


// export async function embedAndStoreDocs(
//   client: PineconeClient,
//   docs: Document[]
// ) {
//   console.log(`Embedding ${docs.length} chunks...`);
//   const texts = docs.map((d) => d.pageContent);
//   const vectors = await embedTexts(texts);

//   const index = client.Index(env.PINECONE_INDEX_NAME);

//   const upserts = vectors.map((vec, i) => ({
//     id: `chunk-${i}`,
//     values: vec,
//     metadata: {
//       text: texts[i],
//       page: docs[i].metadata.page ?? 0,
//     },
//   }));

//   await index.upsert(upserts);
//   console.log('All chunks stored in Pinecone');
// }


export async function embedAndStoreDocs(
  client: PineconeClient,
  docs: Document[],
  sourceName?: string // optional: PDF name or URL
) {
  console.log(`Embedding ${docs.length} chunks...`);
  const texts = docs.map((d) => d.pageContent);
  const vectors = await embedTexts(texts);

  const index = client.Index(env.PINECONE_INDEX_NAME);

  const upserts = vectors.map((vec, i) => ({
    id: uuidv4(), // ✅ ensures unique ID each time
    values: vec,
    metadata: {
      text: texts[i],
      page: docs[i].metadata.page ?? 0,
      source: sourceName ?? "unknown",
      createdAt: new Date().toISOString(),
    },
  }));

  await index.upsert(upserts);
  console.log(`✅ Stored ${upserts.length} new chunks in Pinecone.`);
}

/**
 * Simple similarity search – used later in the chat UI.
 */
export async function similaritySearch(
  client: PineconeClient,
  query: string,
  topK = 5
) {
  const [qVec] = await embedTexts([query]);
  const index = client.Index(env.PINECONE_INDEX_NAME);

  const res = await index.query({
    vector: qVec,
    topK,
    includeMetadata: true,
  });

  return (
    res.matches?.map((m) => ({
      pageContent: m.metadata?.text as string,
      metadata: { page: m.metadata?.page as number },
    })) ?? []
  );
}

/**
 * Returns a custom vector-store handle (no OpenAIEmbeddings used).
 */
export async function getVectorStore(client: PineconeClient) {
  try {
    const embeddings = new CustomEmbeddings();
    const index = client.Index(env.PINECONE_INDEX_NAME);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      textKey: "text", // this must match metadata key when inserting
    });

    return vectorStore;
  } catch (error) {
    console.error("Error creating vector store:", error);
    throw new Error("Something went wrong while getting vector store!");
  }
}