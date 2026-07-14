"use client";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover font-medium shadow-[0_1px_0_rgba(255,255,255,0.15)_inset]",
  secondary:
    "border border-border bg-surface-1 text-foreground hover:bg-surface-2 hover:border-border-strong",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-surface-2",
  danger: "border border-border text-error hover:bg-error/10 hover:border-error/40",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", size = "md", className = "", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md transition-colors disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  );
});

export default Button;
