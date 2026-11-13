const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function SpecificDaysPicker({
    scheduledDays,
    onChange,
    goalColor,
    isMissingScheduledDays
} : {
    scheduledDays: number[],
    onChange: (days: number[]) => void;
    goalColor: string,
    isMissingScheduledDays: boolean,
}) {
    const toggleDay = (day: number) => {
    onChange(
      scheduledDays.includes(day)
        ? scheduledDays.filter((d) => d !== day)
        : [...scheduledDays, day].sort((a, b) => a - b)
    );
  };

    return (
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
            Days
          </span>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, day) => {
              const selected = scheduledDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-9 h-9 rounded-full text-xs font-bold transition-all tap ${
                    selected ? "text-white" : "bg-secondary text-secondary-foreground"
                  }`}
                  style={{ backgroundColor: selected ? goalColor : undefined }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {isMissingScheduledDays && (
            <p className="text-xs text-destructive px-1" >Please select at least one day out of the week.</p>
          )}
        </div> 
    );
}