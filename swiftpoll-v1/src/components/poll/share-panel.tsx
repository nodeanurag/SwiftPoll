"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

/** Copy-link, QR code, and native-share controls for a poll URL. */
export function SharePanel({ slug, question }: { slug: string; question: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // The absolute URL and Web Share availability are browser-only; resolve them
  // after mount. (setState-in-effect is intentional and correct here.)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setUrl(`${window.location.origin}/p/${slug}`);
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; the input below lets users copy manually.
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: "SwiftPoll", text: question, url });
    } catch {
      // user cancelled or unsupported — ignore
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={url}
          aria-label="Poll link"
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 w-full truncate rounded-[var(--radius)] border bg-[var(--color-subtle)] px-3 font-mono text-sm text-[var(--color-muted-fg)]"
        />
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={copy} className="flex-1 sm:flex-none">
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowQr((v) => !v)}
            aria-expanded={showQr}
          >
            QR
          </Button>
          {canShare && (
            <Button variant="secondary" size="md" onClick={nativeShare}>
              Share
            </Button>
          )}
        </div>
      </div>

      {showQr && url && (
        <div className="flex justify-center rounded-[var(--radius)] border bg-white p-4 animate-fade-in-up">
          <QRCodeSVG value={url} size={176} marginSize={2} />
        </div>
      )}
    </div>
  );
}
