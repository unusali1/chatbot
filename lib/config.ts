import z from "zod";

const envSchema = z.object({
  PINECONE_API_KEY: z.string().trim().min(1),
  PINECONE_INDEX_NAME: z.string().trim().min(1),
  GROQ_API_KEY: z.string().trim().min(1),
});

export const env = envSchema.parse(process.env);
