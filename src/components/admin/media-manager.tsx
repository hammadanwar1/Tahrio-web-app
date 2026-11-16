'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2, Video } from 'lucide-react';

import { uploadTicketAction } from '@/lib/admin/actions';
import { productImage } from '@/lib/catalog-core';

const MAX_IMAGES = 8;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

type Ticket = { endpoint: string; ticket: string; at: number };

/** Uploads one file straight to the API with an upload ticket; reports progress (0–1). */
function send(file: File, t: Ticket, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', t.endpoint);
    xhr.setRequestHeader('content-type', file.type);
    xhr.setRequestHeader('x-upload-ticket', t.ticket);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as { url?: string; error?: string };
        if (xhr.status < 300 && body.url) resolve(body.url);
        else reject(new Error(body.error || `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed: could not reach the server'));
    xhr.send(file);
  });
}

/** Displayable URL for a stored photo (API uploads are absolute; seed photos are app asset paths). */
const photoSrc = (url: string) => productImage({ id: '', imageUrl: url }) ?? url;
const playable = (url: string | null) => Boolean(url && /^https?:\/\//.test(url));

/**
 * Product photos (up to 8; the first is the main photo on cards) and an optional video. Files go
 * straight from the browser to the API; the form only submits their URLs (hidden inputs).
 */
export function MediaManager({ initialImages, initialVideo }: { initialImages: string[]; initialVideo: string | null }) {
  const [images, setImages] = useState(initialImages);
  const [video, setVideo] = useState(initialVideo);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ticket = useRef<Ticket | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  async function getTicket() {
    // Tickets last 15 minutes; fetch a fresh one after 10.
    if (ticket.current && Date.now() - ticket.current.at < 10 * 60 * 1000) return ticket.current;
    const res = await uploadTicketAction();
    if ('error' in res) throw new Error(res.error);
    ticket.current = { ...res, at: Date.now() };
    return ticket.current;
  }

  async function addImages(files: File[]) {
    setError(null);
    const room = MAX_IMAGES - images.length;
    if (room <= 0) return setError(`A product can have up to ${MAX_IMAGES} photos.`);
    const bad = files.find((f) => !IMAGE_TYPES.includes(f.type) || f.size > 5 * 1024 * 1024);
    if (bad) return setError(`“${bad.name}” must be a JPEG, PNG or WebP image of 5 MB or less.`);
    try {
      const t = await getTicket();
      for (const [i, file] of files.slice(0, room).entries()) {
        const url = await send(file, t, (p) => setBusy(`Uploading photo ${i + 1} of ${Math.min(files.length, room)}… ${Math.round(p * 100)}%`));
        setImages((list) => [...list, url]);
      }
      if (files.length > room) setError(`Only ${room} more photo${room === 1 ? '' : 's'} fit (max ${MAX_IMAGES}).`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function addVideo(file: File) {
    setError(null);
    if (!VIDEO_TYPES.includes(file.type) || file.size > 50 * 1024 * 1024) {
      return setError('The video must be an MP4 or MOV file of 50 MB or less.');
    }
    try {
      const url = await send(file, await getTicket(), (p) => setBusy(`Uploading video… ${Math.round(p * 100)}%`));
      setVideo(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const move = (i: number, to: number) =>
    setImages((list) => {
      const next = [...list];
      [next[i], next[to]] = [next[to], next[i]];
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="videoUrl" value={video ?? ''} />

      <div>
        <p className="mb-2 text-sm font-medium">
          Photos <span className="font-normal text-muted">({images.length}/{MAX_IMAGES}) · the first one is the main photo</span>
        </p>
        <ul className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <li key={url} className="group relative aspect-square overflow-hidden rounded-chip border border-line bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoSrc(url)} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  <Star size={10} aria-hidden /> Main
                </span>
              )}
              <span className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <IconButton label="Move left" disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ArrowLeft size={14} />
                </IconButton>
                <IconButton label="Remove photo" onClick={() => setImages((l) => l.filter((_, j) => j !== i))} danger>
                  <Trash2 size={14} />
                </IconButton>
                <IconButton label="Move right" disabled={i === images.length - 1} onClick={() => move(i, i + 1)}>
                  <ArrowRight size={14} />
                </IconButton>
              </span>
            </li>
          ))}
          {images.length < MAX_IMAGES && (
            <li>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => imageInput.current?.click()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-chip border-2 border-dashed border-line text-xs font-medium text-primary hover:border-primary disabled:opacity-50"
              >
                <ImagePlus size={22} aria-hidden />
                Add photos
              </button>
            </li>
          )}
        </ul>
        <input
          ref={imageInput}
          type="file"
          multiple
          accept={IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = '';
            if (files.length) void addImages(files);
          }}
        />
        <p className="mt-1.5 text-xs text-muted">JPEG, PNG or WebP, up to 5 MB each. You can pick several at once.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Video</p>
        {video ? (
          <div className="flex flex-col gap-2">
            {playable(video) ? (
              <video src={video} controls preload="metadata" className="aspect-video w-full rounded-chip bg-ink" />
            ) : (
              <p className="rounded-chip bg-bg p-3 text-xs text-muted">Mobile-app demo video (not shown on the website). Upload one to show it there.</p>
            )}
            <div className="flex gap-2">
              <button type="button" disabled={!!busy} onClick={() => videoInput.current?.click()} className="text-xs font-semibold text-primary">
                Replace video
              </button>
              <button type="button" onClick={() => setVideo(null)} className="text-xs font-semibold text-danger">
                Remove video
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => videoInput.current?.click()}
            className="flex h-20 w-full items-center justify-center gap-2 rounded-chip border-2 border-dashed border-line text-sm font-medium text-primary hover:border-primary disabled:opacity-50"
          >
            <Video size={20} aria-hidden /> Upload video
          </button>
        )}
        <input
          ref={videoInput}
          type="file"
          accept={VIDEO_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void addVideo(file);
          }}
        />
        <p className="mt-1.5 text-xs text-muted">MP4 or MOV, up to 50 MB. Shown in the product gallery.</p>
      </div>

      {busy && (
        <p role="status" className="rounded-chip bg-primary-soft px-3 py-2 text-xs font-medium text-primary">
          {busy}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-chip bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}
      <p className="text-xs text-muted">Changes to photos and video are saved when you press Save.</p>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-7 items-center justify-center rounded-full bg-surface/95 shadow disabled:opacity-30 ${danger ? 'text-danger' : 'text-ink'}`}
    >
      {children}
    </button>
  );
}
