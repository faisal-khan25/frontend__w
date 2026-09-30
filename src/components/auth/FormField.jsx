import { useState } from "react";

export default function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  rightElement,
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = isFocused || (value && value.toString().length > 0);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative w-full">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`peer w-full h-[52px] px-4 pt-3 pb-1 rounded-xl bg-white text-[15px] text-ink border transition-all duration-150 focus:outline-none ${
            error
              ? "border-coral focus:border-coral focus:ring-2 focus:ring-coral/15"
              : "border-line focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          } ${rightElement ? "pr-12" : ""}`}
          {...rest}
        />

        <label
          htmlFor={id}
          className={`absolute left-3.5 transition-all duration-150 pointer-events-none bg-white px-1 ${
            isFloating ? "-top-2.5 text-xs font-medium" : "top-3.5 text-[15px]"
          } ${error ? "text-coral" : isFocused ? "text-primary-600" : "text-faint"}`}
        >
          {label}
        </label>

        {rightElement && (
          <div className="absolute right-3.5 inset-y-0 flex items-center">{rightElement}</div>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs text-coral font-normal px-1 mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}
