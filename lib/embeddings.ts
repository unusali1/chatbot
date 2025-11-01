// lib/embeddings.ts
import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';

// Use the correct pipeline type: FeatureExtractionPipeline
let embedder: FeatureExtractionPipeline | null = null;

async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!embedder) {
    console.log('Downloading Xenova/all-MiniLM-L6-v2 (first run only)...');
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      {
        cache_dir: './.cache/hf',
        quantized: true,
      }
    );
    console.log('Model loaded!');
  }
  return embedder;
}

/**
 * Embed multiple texts → returns 384-dim vectors
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = await getEmbedder();

  const results = await Promise.all(
    texts.map(async (text) => {
      const output = await model(text, {
        pooling: 'mean',
        normalize: true,
      });

      // `output.data` is Float32Array
      return Array.from(output.data) as number[];
    })
  );

  return results;
}