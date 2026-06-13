"use client";

import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  BRAND_LOGO_IMAGE_ALLOWED_TYPES,
  BRAND_LOGO_IMAGE_MAX_BYTES,
  validateBrandLogoImageFile,
} from "@portfolio/validators";

interface BrandLogoUploadProps {
  currentLogoUrl: string | null;
  currentFilename?: string | null | undefined;
  currentSizeBytes?: number | null | undefined;
  currentLogoImageId?: string | null | undefined;
  fallbackInitials: string;
  logoSize: number;
}

function formatBytes(bytes: number | null | undefined): string | null {
  if (!bytes) {
    return null;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PendingLogoState({ hasSelectedFile }: { hasSelectedFile: boolean }) {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-accent-100">
      <UploadCloud className="size-3.5" aria-hidden />
      {hasSelectedFile ? "Saving logo upload..." : "Saving brand settings..."}
    </p>
  );
}

export function BrandLogoUpload({
  currentLogoUrl,
  currentFilename,
  currentSizeBytes,
  currentLogoImageId,
  fallbackInitials,
  logoSize,
}: BrandLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const maxSizeLabel = useMemo(
    () => `${Math.round(BRAND_LOGO_IMAGE_MAX_BYTES / 1024 / 1024)} MB`,
    [],
  );
  const displayUrl = removeLogo ? null : previewUrl ?? currentLogoUrl;
  const displayName = selectedName ?? currentFilename;
  const displaySize = selectedSize ?? currentSizeBytes;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearSelectedFile() {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.setCustomValidity("");
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedName(null);
    setSelectedSize(null);
  }

  function handleFileChange(file: File | null) {
    setError(null);
    setRemoveLogo(false);

    if (!file || file.size === 0) {
      clearSelectedFile();
      return;
    }

    const validation = validateBrandLogoImageFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!validation.ok) {
      clearSelectedFile();
      setError(validation.reason);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedName(file.name);
    setSelectedSize(file.size);
    inputRef.current?.setCustomValidity("");
  }

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-white/[0.025] p-4">
      <input type="hidden" name="brandLogoImageId" value={currentLogoImageId ?? ""} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-violet-400 via-sky-400 to-emerald-300 text-xs font-black text-slate-950 shadow-sm"
          style={{ width: logoSize, height: logoSize }}
          aria-hidden
        >
          {displayUrl ? (
            <img src={displayUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{fallbackInitials}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            {displayName ? displayName : "HB initials fallback"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            PNG, JPEG, WebP, or GIF. Keep it square when possible. Max {maxSizeLabel}.
          </p>
          {displaySize ? (
            <p className="mt-1 text-xs text-muted/75">{formatBytes(displaySize)}</p>
          ) : null}
          {error ? (
            <p className="mt-2 rounded-md border border-danger-500/30 bg-danger-500/10 px-2.5 py-1.5 text-xs font-medium text-danger-100">
              {error}
            </p>
          ) : null}
          <PendingLogoState hasSelectedFile={Boolean(selectedName)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="ui-btn-secondary cursor-pointer">
          <ImagePlus className="size-3.5" aria-hidden />
          {currentLogoUrl ? "Replace logo" : "Upload logo"}
          <input
            ref={inputRef}
            className="sr-only"
            name="brandLogoImage"
            type="file"
            accept={BRAND_LOGO_IMAGE_ALLOWED_TYPES.join(",")}
            onChange={(event) => handleFileChange(event.currentTarget.files?.[0] ?? null)}
          />
        </label>

        {currentLogoUrl || selectedName ? (
          <label className="ui-btn-ghost cursor-pointer">
            <input
              className="sr-only"
              name="removeBrandLogoImage"
              type="checkbox"
              checked={removeLogo}
              onChange={(event) => {
                const checked = event.currentTarget.checked;
                setRemoveLogo(checked);
                if (checked) {
                  clearSelectedFile();
                }
              }}
            />
            <Trash2 className="size-3.5" aria-hidden />
            {removeLogo ? "Logo will be removed" : "Remove logo"}
          </label>
        ) : null}
      </div>
    </div>
  );
}
