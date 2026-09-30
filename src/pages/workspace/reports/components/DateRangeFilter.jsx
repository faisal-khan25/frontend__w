import { useState } from "react";
import { DATE_RANGE_PRESETS } from "../../../../utils/reportsConstants";

export default function DateRangeFilter({ range, from, to, onChange }) {
  const [customMode, setCustomMode] = useState(!!(from || to));
  const isCustom = customMode || !!(from || to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="input-field !w-auto !py-2 text-sm"
        value={isCustom ? "custom" : range || ""}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "custom") {
            setCustomMode(true);
          } else {
            setCustomMode(false);
            onChange({ range: val, from: "", to: "" });
          }
        }}
      >
        {DATE_RANGE_PRESETS.map((p) => (
          <option key={p.key || "all"} value={p.key}>{p.label}</option>
        ))}
        <option value="custom">Custom range</option>
      </select>

      {isCustom && (
        <>
          <input
            type="date"
            className="input-field !w-auto !py-2 text-sm"
            value={from || ""}
            onChange={(e) => onChange({ range: "", from: e.target.value, to })}
            aria-label="From date"
          />
          <span className="text-faint text-sm">to</span>
          <input
            type="date"
            className="input-field !w-auto !py-2 text-sm"
            value={to || ""}
            onChange={(e) => onChange({ range: "", from, to: e.target.value })}
            aria-label="To date"
          />
        </>
      )}
    </div>
  );
}
