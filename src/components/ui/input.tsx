import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, autoComplete, name, id, ...props }, ref) => {
    // Generate a neutral random-ish id/name to avoid login heuristics
    const neutralId = React.useId();
    const safeName = name || `field-${neutralId.replace(/:/g, "")}`;
    const safeId = id || `input-${neutralId.replace(/:/g, "")}`;

    // "new-password" is the most aggressive blocker for Chrome/Android autofill
    const safeAutoComplete = autoComplete ?? "new-password";

    return (
      <input
        type={type || "text"}
        name={safeName}
        id={safeId}
        autoComplete={safeAutoComplete}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore=""
        data-lpignore="true"
        data-protonpass-ignore="true"
        data-bwignore=""
        data-form-type="other"
        data-credential="false"
        aria-autocomplete="none"
        inputMode={type === "number" ? "numeric" : undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
