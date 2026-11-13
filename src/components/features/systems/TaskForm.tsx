"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import TimesPerWeekSlider from "./TimesPerWeekSlider";
import SpecificDaysPicker from "./SpecificDaysPicker";

export type TaskFormData = {
  title: string;
  type: "recurring" | "one_time";
  frequency: "daily" | "specific_days" | "flexible";
  scheduled_days: number[] | null;
  times_per_week: number | null;
};

export default function TaskForm({
  goalColor = "#ff0055",
  initialData,
  onSave,
  onCancel,
  saveLabel = "Add System",
  savingLabel = "Adding...",
  headerLabel = "New System",
  headerIcon = "solar:refresh-bold",
}: {
  goalColor?: string;
  initialData?: TaskFormData;
  onSave: (data: TaskFormData) => Promise<void> | void;
  onCancel: () => void;
  saveLabel?: string;
  savingLabel?: string;
  headerLabel?: string;
  headerIcon?: string;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [type, setType] = useState<"recurring" | "one_time">(initialData?.type || "recurring");
  const [frequency, setFrequency] = useState<"daily" | "specific_days" | "flexible">(
    initialData?.frequency || "daily"
  );
  const [scheduledDays, setScheduledDays] = useState<number[]>(
    initialData?.scheduled_days || []
  );
  const [timesPerWeek, setTimesPerWeek] = useState<number>(initialData?.times_per_week || 3);
  const [loading, setLoading] = useState(false);
  const isWeeklyType = frequency !== "daily";

  const isMissingScheduledDays = 
  frequency === "specific_days" && scheduledDays.length === 0;

  const handleSave = async () => {
    if (!title.trim() || isMissingScheduledDays) return;
    setLoading(true);
    await onSave({
      title: title.trim(),
      type,
      frequency,
      scheduled_days: frequency === "specific_days" ? scheduledDays : null,
      times_per_week:  frequency === "flexible" ? timesPerWeek : null,
    });
    setLoading(false);
  };

  return (
    <div
      className="bg-card rounded-3xl p-6 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)] animate-expand overflow-hidden"
      style={{ border: `2px solid ${goalColor}30` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${goalColor}15`, color: goalColor }}
        >
          <Icon icon={headerIcon} />
        </div>
        <h3 className="text-base font-heading font-bold tracking-tight">{headerLabel}</h3>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onCancel();
        }}
        className="w-full bg-secondary/30 border-b border-muted/50 h-12 px-1 font-bold text-base outline-none focus:border-primary transition-colors"
        placeholder="Task name (e.g., Study 30 mins)"
      />

      <div className="space-y-3">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
          Type
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("recurring")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all tap ${
              type === "recurring" ? "text-white shadow-sm" : "bg-secondary text-secondary-foreground"
            }`}
            style={{ backgroundColor: type === "recurring" ? goalColor : undefined }}
          >
            Recurring
          </button>
          <button
            type="button"
            onClick={() => setType("one_time")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all tap ${
              type === "one_time" ? "text-white shadow-sm" : "bg-secondary text-secondary-foreground"
            }`}
            style={{ backgroundColor: type === "one_time" ? goalColor : undefined }}
          >
            One-time
          </button>
        </div>
      </div>

      {type === "recurring" && (
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
            Frequency
          </span>
          <div className="flex gap-2">
            {(["daily", "weekly"] as const).map((f) => {
              const isActive = f === "daily" ? frequency === "daily" : isWeeklyType;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    if (f === "daily") setFrequency("daily");
                    else if (!isWeeklyType) setFrequency("flexible");
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all tap ${
                    isActive ? "text-white shadow-sm" : "bg-secondary text-secondary-foreground"
                  }`}
                  style={{ backgroundColor: isActive ? goalColor : undefined }}
                >
                  {f === "daily" ? "Daily" : "Weekly"}
                </button>
              );
            })}
          </div>
        </div>
      )}

       {type === "recurring" && isWeeklyType && (
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
            Weekly Type
          </span>
          <div className="flex gap-2">
            {(["flexible", "specific_days"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all tap ${
                  frequency === f ? "text-white shadow-sm" : "bg-secondary text-secondary-foreground"
                }`}
                style={{ backgroundColor: frequency === f ? goalColor : undefined }}
              >
                {f === "flexible" ? "Flexible" : "Specific Days"}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === "recurring" && frequency === "flexible" &&  (
        <TimesPerWeekSlider 
          timesPerWeek={timesPerWeek}
          onChange={setTimesPerWeek}
          goalColor={goalColor}
        />
      )}

      {type === "recurring" && frequency === "specific_days" && (
        <SpecificDaysPicker 
          scheduledDays={scheduledDays}
          onChange={setScheduledDays}
          goalColor={goalColor}
          isMissingScheduledDays={isMissingScheduledDays}       
        />
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-12 rounded-2xl bg-secondary text-secondary-foreground font-bold text-sm transition-all active:scale-95 tap"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !title.trim() || isMissingScheduledDays}
          className="flex-1 h-12 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 tap"
          style={{ backgroundColor: goalColor }}
        >
          {loading ? savingLabel : saveLabel}
        </button>
      </div>
    </div>
  );
}