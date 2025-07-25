"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { auth } from "@/lib/firebase";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function UploadProjectModal({ open, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    validateAndSetFile(uploaded);
  };

  const validateAndSetFile = (uploaded?: File) => {
    if (!uploaded) return;
    if (!uploaded.name.endsWith(".zip")) {
      toast.error("Only ZIP files are supported.");
      return;
    }
    setFile(uploaded);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = await auth.currentUser?.getIdToken(true);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`${file.name} uploaded successfully!`);
        setFile(null);
        onClose();
      } else {
        toast.error(`Upload failed: ${result?.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Upload Project
          </DialogTitle>
        </DialogHeader>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            validateAndSetFile(dropped);
          }}
          className={clsx(
            "border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
            dragOver && "bg-muted/40",
            file ? "border-green-500 bg-green-50" : "hover:bg-muted/30"
          )}
        >
          <UploadCloud className="mx-auto mb-2 text-primary" size={32} />
          <p className="text-sm font-medium text-muted-foreground">
            {file ? file.name : "Click or drag a ZIP file here to upload"}
          </p>
        </div>

        <input
          type="file"
          accept=".zip"
          hidden
          ref={inputRef}
          onChange={handleFileChange}
        />

        <Button
          disabled={!file || uploading}
          onClick={handleUpload}
          className="w-full mt-4"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
