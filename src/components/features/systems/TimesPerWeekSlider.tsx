export default function TimesPerWeekSlider({
    timesPerWeek,
    onChange,
    goalColor,
} : {
    timesPerWeek: number,
    onChange: (value: number) => void;
    goalColor: string,
}) {
    return (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              Days per week
            </span>
            <span className="text-sm font-heading font-bold" style={{ color: goalColor }}>
              {timesPerWeek}× / week
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={7}
            step={1}
            value={timesPerWeek}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label="Days per week"
            className="w-full h-2 cursor-pointer"
            style={{ accentColor: goalColor }}
          />
          <div className="flex justify-between px-0.5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <span
                key={n}
                className={`text-[10px] font-bold ${n === timesPerWeek ? "" : "text-muted-foreground/50"}`}
                style={{ color: n === timesPerWeek ? goalColor : undefined }}
              >
                {n}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground px-1">
            Complete any {timesPerWeek} day{timesPerWeek === 1 ? "" : "s"} during the week.
          </p>
        </div>


    );
}