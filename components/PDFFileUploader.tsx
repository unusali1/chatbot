"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { Pencil, XCircle } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";
import {
  FaFilePdf,
  FaImage,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFilePowerpoint,
  FaFileAlt,
} from "react-icons/fa";
import { MdTextSnippet } from "react-icons/md";

export type FileProps = {
  title: string;
  type: string;
  size: number;
  url: string;
};

type PDFUploadInputProps = {
  label: string;
  file: FileProps | null;
  setFile: React.Dispatch<React.SetStateAction<FileProps | null>>;
  className?: string;
  endpoint?: string;
};

export function getFileIcon(extension: string | undefined) {
  switch (extension) {
    case "pdf":
      return <FaFilePdf className="w-6 h-6 shrink-0 mr-2 text-red-500" />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return <FaImage className="w-6 h-6 shrink-0 mr-2 text-gray-600" />;
    case "doc":
    case "docx":
      return <FaFileWord className="w-6 h-6 shrink-0 mr-2 text-blue-500" />;
    case "xls":
    case "xlsx":
      return <FaFileExcel className="w-6 h-6 shrink-0 mr-2 text-green-500" />;
    case "ppt":
    case "pptx":
      return <FaFilePowerpoint className="w-6 h-6 shrink-0 mr-2 text-orange-500" />;
    case "zip":
    case "gzip":
    case "tar":
      return <FaFileArchive className="w-6 h-6 shrink-0 mr-2 text-yellow-600" />;
    case "txt":
      return <MdTextSnippet className="w-6 h-6 shrink-0 mr-2 text-gray-500" />;
    default:
      return <FaFileAlt className="w-6 h-6 shrink-0 mr-2 text-gray-500" />;
  }
}

export default function PDFFileUpload({
  label,
  file,
  setFile,
  className = "col-span-full",
  endpoint = "mixedUploader", // default endpoint
}: PDFUploadInputProps) {
  const extension = file ? file.title.split(".").pop()?.toLowerCase() : "";

  return (
    <div className={className}>
      {/* Label & Change Button */}
      <div className="flex justify-between items-center mb-4">
        <label className="block text-sm font-medium text-gray-900 dark:text-slate-50 mb-2">
          {label}
        </label>
        {file && (
          <button
            onClick={() => setFile(null)}
            type="button"
            className="flex space-x-2 bg-slate-900 rounded-md shadow text-slate-50 py-2 px-4"
          >
            <Pencil className="w-5 h-5" />
            <span>Change File</span>
          </button>
        )}
      </div>

      {/* Uploaded File Display */}
      {file ? (
        <div className="relative mb-6">
          <button
            type="button"
            onClick={() => setFile(null)}
            className="absolute -top-4 -right-2 bg-slate-100 text-red-600 rounded-full"
          >
            <XCircle />
          </button>
          <div className="py-2 px-6 bg-white dark:bg-slate-800 text-slate-800 flex items-center dark:text-slate-200 border border-slate-200 rounded-md">
            {getFileIcon(extension)}
            <div className="flex flex-col">
              <span className="line-clamp-1">{file.title}</span>
              {file.size > 0 && (
                <span className="text-xs">{(file.size / 1000).toFixed(2)} kb</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        // UploadDropzone
        <UploadDropzone
          endpoint={endpoint}
          onClientUploadComplete={(res) => {
            if (!res[0]) return;
            const item = res[0];
            setFile({
              url: item.url,
              title: item.name,
              size: item.size,
              type: item.type,
            });
            toast.success("Upload Completed");
            console.log("Uploaded File:", item);
          }}
          onUploadError={(error) => {
            toast.error("File Upload Failed, Try Again");
            console.error(error);
          }}
        />
      )}
    </div>
  );
}
