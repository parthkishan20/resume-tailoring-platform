"use client";
import { useEffect, useRef, useState } from "react";
import Button from "./Button";

interface Props {
  onConfirm: () => void;
  label: string;
  confirmLabel?: string;
  size?: "sm" | "md";
  className?: string;
  children?: React.ReactNode;
}

/** Two-step destructive button: first click arms it, second click confirms. */
export default function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Confirm?",
  size = "sm",
  className = "",
  children,
}: Props) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleClick() {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    clearTimeout(timer.current);
    setArmed(false);
    onConfirm();
  }

  return (
    <Button
      variant="danger"
      size={size}
      onClick={handleClick}
      onBlur={() => setArmed(false)}
      className={armed ? "!border-error/60 !bg-error/10" : className}
      aria-label={armed ? confirmLabel : label}
    >
      {armed ? confirmLabel : children ?? label}
    </Button>
  );
}
