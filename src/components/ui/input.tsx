"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  resetKey?: number; // Add this prop to trigger reset
}

const Input = React.forwardRef<HTMLTextAreaElement, InputProps>(
  ({ className, maxLength, resetKey, ...props }, ref) => {
    const [value, setValue] = React.useState(props.defaultValue?.toString() || "");
    const [isScrolling, setIsScrolling] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
      }
    }, []);

    React.useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    React.useEffect(() => {
      setValue(props.value?.toString() || "");
      adjustHeight();
    }, [props.value, resetKey, adjustHeight]);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      if (!maxLength || newValue.length <= maxLength) {
        setValue(newValue);
        if (props.onChange) {
          props.onChange(event);
        }
      }
    };

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    };

    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-auto min-h-[48px] max-h-[240px]",
            "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500",
            isScrolling ? "scrollbar-thumb-opacity-100" : "scrollbar-thumb-opacity-0",
            className
          )}
          ref={(node) => {
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            textareaRef.current = node;
          }}
          onChange={handleChange}
          onInput={adjustHeight}
          onScroll={handleScroll}
          rows={1}
          value={value}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }