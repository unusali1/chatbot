"use client";
import { prepare } from "@/actions/prepare";
import { Button } from "@/components/ui/button";
import { PDFSource } from "@/lib/pdf-loader";
import { UploadButton } from "@/lib/uploadthing";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

type FileProps = {
  url: string;
  name: string;
};

export default function Page() {
  const [file, setFile] = useState<FileProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  async function submit() {
    if (!file) return;
    try {
      setLoading(true);
      setLoadingMsg("Initializing Client and creating index...");

      const pdfSource: PDFSource = {
        type: "url",
        source: file.url,
      };

      await prepare(pdfSource);

      setLoading(false);
      alert("PDF processed successfully!");
    } catch (error) {
      setLoading(false);
      setLoadingMsg("");
      console.error(error);
      alert("Error processing PDF");
    }
  }

  return (
    <div className="flex flex-1 py-16">
      <div className="w-full max-w-2xl mx-auto">
        {file ? (
          <>
            {loading ? (
              <Button disabled>
                <Loader2 className="animate-spin mr-2" />
                {loadingMsg}
              </Button>
            ) : (
              <Button onClick={submit}>Upload to Pinecone</Button>
            )}
          </>
        ) : (
          <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <UploadButton
              endpoint="documentUploader"
              onClientUploadComplete={(res) => {
                // res is array of UploadedFile
                console.log("Files uploaded:", res);
                const uploaded = res[0];
                setFile({
                  url: uploaded.url,
                  name: uploaded.name,
                });
                alert("Upload Completed");
              }}
              onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
              }}
            />
          </main>
        )}
      </div>
    </div>
  );
}
