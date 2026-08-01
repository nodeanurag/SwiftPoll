"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

/** Copy-link, QR code, and native-share controls for a poll URL. */
export function SharePanel({ slug, question }: { slug: string; question: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/p/${slug}`);
  }, [slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; user can copy manually.
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
        </div>
      </div>
    </div>
  );
}
