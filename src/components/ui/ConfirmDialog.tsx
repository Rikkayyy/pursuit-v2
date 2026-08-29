"use client";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[70] animate-in fade-in duration-150"
        onClick={onCancel}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[80] mx-auto max-w-sm rounded-2xl bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center mb-5">
          <h2 className="font-heading font-bold text-lg text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-secondary py-3 text-sm font-bold text-foreground hover:bg-secondary/70 transition-colors tap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition-colors tap ${
              destructive ? "bg-destructive hover:bg-destructive/90" : ""
            }`}
            style={!destructive ? { backgroundColor: "#ff0055" } : undefined}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
