import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SearchOption {
  value: string;
  label: string;
  data?: unknown;
}

interface SearchProps {
  options: SearchOption[];
  placeholder?: string;
  onSelect: (option: SearchOption) => void;
  className?: string;
  disabled?: boolean;
}

export function Search({
  options,
  placeholder = "Search...",
  onSelect,
  className,
  disabled = false,
}: SearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (query.trim() === "") {
      setFilteredOptions([]);
      setIsOpen(false);
      return;
    }

    const filtered = options.filter(
      (option) =>
        option.label.toLowerCase().includes(query.toLowerCase()) ||
        option.value.toLowerCase().includes(query.toLowerCase()),
    );

    setFilteredOptions(filtered);
    setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [query, options]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(filteredOptions[selectedIndex]!);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (option: SearchOption) => {
    if (disabled) return;
    setQuery(option.label);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(option);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (disabled) return;
    if (filteredOptions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for option selection
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
          disabled && "cursor-not-allowed bg-gray-50 text-gray-400",
        )}
      />

      {isOpen && filteredOptions.length > 0 && !disabled && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm hover:bg-gray-100",
                selectedIndex === index && "bg-blue-50 text-blue-900",
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(option)}
            >
              <div className="flex items-center justify-between">
                <span>{option.label}</span>
                {option.value.startsWith("state-") && (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    State
                  </span>
                )}
                {option.value.startsWith("county-") && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-gray-500">
                    County
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
