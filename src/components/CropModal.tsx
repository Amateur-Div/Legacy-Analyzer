"use client";

import Cropper from "react-easy-crop";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import getCroppedImg from "@/lib/cropImage";

interface Props {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

export default function CropModal({
  imageSrc,
  onClose,
  onCropComplete,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-xl max-w-lg w-full">
        <div className="relative w-full aspect-square bg-gray-200">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedPixels) =>
              setCroppedAreaPixels(croppedPixels)
            }
          />
        </div>
        <div className="mt-4 flex justify-between gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const croppedBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
              );
              onCropComplete(croppedBlob);
              onClose();
            }}
          >
            Crop & Upload
          </Button>
        </div>
      </div>
    </div>
  );
}
