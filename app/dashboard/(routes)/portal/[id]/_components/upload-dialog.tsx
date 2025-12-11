"use client"

import { useState } from "react"

import { Loader2, UploadCloud } from "lucide-react"
// import { addSubmission, hasSubmitted } from "@/lib/db"
import { Portal } from "../../_components/table/schema"
import { MediaType } from "@prisma/client"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/app/_components/ui/dialog"
import { Button } from "@/app/_components/ui/button"
import { AlertDialogHeader } from "@/app/_components/ui/alert-dialog"
import { Badge } from "@/app/_components/ui/badge"
import { Input } from "@/app/_components/ui/input"
import { addSubmission, upsertSubmission } from "../../action"
import { convertToMp3, hasSubmitted } from "@/app/_lib/utils"
import UploadMedia from "../../../courses/[courseId]/[levelId]/_components/form/upload-media"
import axios, { AxiosProgressEvent } from "axios"

type Props = {
  portal: Portal
  studentId: string
  triggerClassName?: string
}

const link = process.env.NEXT_PUBLIC_CLOUDINARY_URL;

const Cloudinary = axios.create({
  baseURL: link,
});

function acceptFor(type: MediaType) {
  switch (type) {
    case "AUDIO":
      return "audio/*"
    case "VIDEO":
      return "video/*"
    case "EBOOK":
      return ".pdf,.epub,.mobi,.azw,.azw3,application/pdf,application/epub+zip"
  }
}

function humanType(type: MediaType) {
  if (type === "EBOOK") return "E‑book (PDF/EPUB/MOBI)"
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function UploadDialog({ portal, studentId, triggerClassName }: Props) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);


  const alreadySubmitted = hasSubmitted(portal.submissions, studentId)
  const now = new Date()
  const start = new Date(portal.openDate)
  const end = new Date(portal.closeDate)
  const disabled = now < start || now > end


  const handleUpload = async (file: File) => {
    setUploading(true);

    const formData = new FormData();

    formData.append('file', file);
    formData.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!
    );

    try {
      const response = await Cloudinary.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const { loaded, total } = progressEvent;
          const progress = loaded / (total || 1);
          setUploadProgress(progress);
        },
      });

      const { secure_url } = response.data;
      setFile(
        portal.type === 'AUDIO' ? convertToMp3(secure_url) : secure_url
      );

    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  };

  const onSubmit = async () => {
    if (!file) {
      toast.success("No file selected", { description: "Choose a file before submitting." })
      return
    }

    try {
      setSubmitting(true)
      await upsertSubmission({
        portalId: portal.id,
        studentId,
        file,
      })
      const message = alreadySubmitted ? "Resubmitted" : "Submitted"
      const description = alreadySubmitted 
        ? "Your file was updated successfully." 
        : "Your file was uploaded successfully."
      
      toast.success(message, { description })
      setOpen(false)
      setFile(null)
      window.location.reload();
    } catch (e: any) {
      toast.success(
        "Submission failed",
        {
          description: e?.message ?? "Please try again.",
          variant: "destructive",
        } as any)
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName} disabled={disabled}>
          {disabled ? "Portal is closed" : alreadySubmitted ? "Resubmit" : "Submit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <DialogTitle>{alreadySubmitted ? "Resubmit to Portal" : "Submit to Portal"}</DialogTitle>
          <DialogDescription>
            {alreadySubmitted 
              ? "Upload a new file to replace your previous submission. This will overwrite your existing submission."
              : "Upload the requested file type below. You can resubmit while the portal is open."
            }
          </DialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                {/* <div className="font-medium">{portal.desc}</div> */}
                <div className="text-sm text-muted-foreground">{portal.course}</div>
              </div>
              <Badge variant="secondary">{humanType(portal.type)}</Badge>
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium mb-2 block">Choose file</label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept={acceptFor(portal.type)}
                  onChange={handleFileChange}
                />
                {uploading && (
                  <>
                    <span>{(uploadProgress * 100).toFixed(2)}%</span>
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </>
                )}
                <UploadCloud className="h-5 w-5 text-muted-foreground" />
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Allowed:{" "}
                {portal.type === "AUDIO"
                  ? "audio/*"
                  : portal.type === "VIDEO"
                    ? "video/*"
                    : "PDF, EPUB, MOBI"}
              </p>
            </div>
          </div>

        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting || !file}>
            {submitting 
              ? (alreadySubmitted ? "Resubmitting..." : "Submitting...") 
              : (alreadySubmitted ? "Resubmit" : "Submit")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
