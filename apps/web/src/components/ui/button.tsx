import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-[12px] font-semibold leading-5 transition duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-navy text-white shadow-[0_8px_22px_rgba(11,36,84,.16)] hover:-translate-y-0.5 hover:bg-navy-soft",
        teal: "bg-teal text-navy hover:bg-teal-bright",
        secondary:
          "border border-navy/[0.09] bg-white text-navy hover:border-teal/30 hover:bg-cloud",
        ghost: "text-slate hover:bg-navy/[0.05] hover:text-navy",
        danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
      },
      size: {
        sm: "min-h-8 rounded-lg px-3 text-[11px]",
        md: "min-h-10 px-4",
        lg: "min-h-12 rounded-[14px] px-5 text-[13px]",
        icon: "size-10 min-h-10 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
