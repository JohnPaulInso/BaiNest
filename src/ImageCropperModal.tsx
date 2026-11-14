// (2026-07-13) Modal to crop photos to standard blog ratio. Prev: none
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Crop, ZoomIn, ZoomOut, RotateCcw, X, Check } from "lucide-react";

export type AspectRatioOption = {
  label: string;
  value: number;
};

const ASPECT_OPTIONS: AspectRatioOption[] = [
  { label: "16:9 Blog Standard", value: 16 / 9 },
  { label: "2:1 Wide Banner", value: 2 / 1 },
  { label: "4:3 Standard", value: 4 / 3 },
  { label: "1:1 Square", value: 1 / 1 },
];

type Props = {
  imageSrc: string;
  onCrop: (croppedFile: File, croppedUrl: string) => void;
  onClose: () => void;
};

export function ImageCropperModal({ imageSrc, onCrop, onClose }: Props) {
  const [aspect, setAspect] = useState<number>(16 / 9);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // (2026-07-13) Scale base image to viewport and support zoom down to 20%. Prev: 80% min
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 560, height: 315 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setViewportSize({ width: rect.width, height: rect.height });
        }
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [aspect]);

  const baseScale =
    imgNaturalSize && viewportSize.width > 0 && viewportSize.height > 0
      ? Math.min(viewportSize.width / imgNaturalSize.width, viewportSize.height / imgNaturalSize.height)
      : 1;

  // (2026-07-13) Only set crossOrigin for external URLs. Prev: always anonymous
  useEffect(() => {
    const img = new Image();
    if (imageSrc.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Pointer drag handling
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((z) => Math.min(3, Math.max(0.2, z + delta)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Perform canvas crop
  const handleApply = useCallback(() => {
    if (!imgNaturalSize || !containerRef.current) return;

    const viewport = containerRef.current.getBoundingClientRect();
    const vWidth = viewport.width || viewportSize.width;
    const vHeight = viewport.height || viewportSize.height;

    const currentBaseScale = Math.min(vWidth / imgNaturalSize.width, vHeight / imgNaturalSize.height);

    // (2026-07-13) Output persistent base64 dataUrl on crop. Prev: blob URL
    const outputWidth = 840;
    const outputHeight = Math.round(outputWidth / aspect);

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const scaleRatio = outputWidth / vWidth;

    const imageElement = new Image();
    if (imageSrc.startsWith("http")) imageElement.crossOrigin = "anonymous";
    imageElement.onload = () => {
      ctx.save();
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.translate(pan.x * scaleRatio, pan.y * scaleRatio);
      const drawW = imgNaturalSize.width * currentBaseScale * zoom * scaleRatio;
      const drawH = imgNaturalSize.height * currentBaseScale * zoom * scaleRatio;
      ctx.drawImage(imageElement, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.64);
      canvas.toBlob(
        (blob) => {
          const croppedFile = blob
            ? new File([blob], "blog-cover-standard.jpg", { type: "image/jpeg" })
            : new File([], "blog-cover-standard.jpg", { type: "image/jpeg" });
          onCrop(croppedFile, croppedDataUrl);
        },
        "image/jpeg",
        0.64
      );
    };
    imageElement.src = imageSrc;
  }, [imgNaturalSize, viewportSize, aspect, pan, zoom, imageSrc, onCrop]);

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-box">
        <div className="crop-modal-header">
          <div className="crop-modal-title">
            <Crop size={18} />
            <span>Crop to Standard Blog Size</span>
          </div>
          <button type="button" className="crop-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Aspect ratio buttons */}
        <div className="crop-ratio-tabs">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.label}
              className={`crop-ratio-pill ${aspect === opt.value ? "active" : ""}`}
              onClick={() => {
                setAspect(opt.value);
                setPan({ x: 0, y: 0 });
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Crop viewport */}
        <div className="crop-viewport-wrapper">
          <div
            ref={containerRef}
            className="crop-viewport-box"
            style={{ aspectRatio: String(aspect) }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* (2026-07-13) Base image scaled to frame, zoom down to 20%. Prev: unscaled */}
            {imageSrc && imgNaturalSize && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                className="crop-active-image"
                draggable={false}
                style={{
                  width: `${imgNaturalSize.width * baseScale}px`,
                  height: `${imgNaturalSize.height * baseScale}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              />
            )}
            <div className="crop-grid-overlay">
              <div className="crop-grid-line crop-grid-h1" />
              <div className="crop-grid-line crop-grid-h2" />
              <div className="crop-grid-line crop-grid-v1" />
              <div className="crop-grid-line crop-grid-v2" />
            </div>
            <span className="crop-drag-hint">Drag to reposition image</span>
          </div>
        </div>

        {/* Zoom and controls bar */}
        <div className="crop-controls-bar">
          <div className="crop-zoom-strip">
            <ZoomOut size={15} />
            {/* (2026-07-13) Wide zoom slider from 20% to 300%. Prev: 80% min */}
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.02"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="crop-zoom-slider"
            />
            <ZoomIn size={15} />
            <span className="crop-zoom-label">{Math.round(zoom * 100)}%</span>
          </div>
          <button type="button" className="crop-reset-btn" onClick={handleReset}>
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        {/* Modal actions */}
        <div className="crop-modal-footer">
          <button type="button" className="crop-cancel-btn" onClick={onClose}>
            Cancel / Keep Original
          </button>
          <button type="button" className="crop-confirm-btn" onClick={handleApply}>
            <Check size={16} /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

