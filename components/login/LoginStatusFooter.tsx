import { Lock } from "lucide-react";

export default function LoginStatusFooter() {
  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-40 flex items-center justify-between p-4 opacity-60">
      <div className="flex items-center gap-2 text-outline">
        <Lock className="size-3.5" aria-hidden />
        <p className="font-label text-xs tracking-widest uppercase">
          Encryption Active: RSA-4096
        </p>
      </div>
      <p className="font-label text-xs tracking-tighter text-outline uppercase">
        System Revision: v2.4.1
      </p>
    </div>
  );
}
