"use client";

import { cn } from "@/lib/utils";
import { useEffect, useId, useRef, useState } from "react";

export type BookFormSelectOption = {
  value: string;
  label: string;
};

type BookFormSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: BookFormSelectOption[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  showPlaceholder?: boolean;
};

export default function BookFormSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className,
  showPlaceholder = true,
}: BookFormSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "book-form-select-trigger w-full px-4 py-3 text-left font-body-md text-sm",
          !selectedOption && "text-outline/70",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="block truncate pr-6">{displayLabel}</span>
      </button>

      {isOpen ? (
        <ul
          role="listbox"
          aria-labelledby={selectId}
          className="book-form-select-dropdown custom-scroll"
        >
          {showPlaceholder ? (
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === ""}
                onClick={() => handleSelect("")}
                className={cn(
                  "book-form-select-option book-form-select-option--placeholder",
                  value === "" && "book-form-select-option--selected",
                )}
              >
                {placeholder}
              </button>
            </li>
          ) : null}
          {options.map((option) => (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "book-form-select-option",
                  value === option.value && "book-form-select-option--selected",
                )}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
