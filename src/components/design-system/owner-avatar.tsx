"use client";

import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";

interface OwnerAvatarProps {
  name?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function OwnerAvatar({ name, image, size = "sm", className }: OwnerAvatarProps) {
  const sizeClass = SIZES[size];

  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? "User"}
        width={size === "lg" ? 40 : size === "md" ? 32 : 24}
        height={size === "lg" ? 40 : size === "md" ? 32 : 24}
        className={cn(
          "rounded-full ring-2 ring-surface object-cover shrink-0",
          sizeClass,
          className
        )}
      />
    );
  }

  if (name) {
    return (
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-accent/80 to-accent shrink-0",
          "flex items-center justify-center font-semibold text-accent-fg",
          "ring-2 ring-surface",
          sizeClass,
          className
        )}
        title={name}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-border shrink-0",
        "flex items-center justify-center text-muted",
        "ring-2 ring-surface border border-dashed border-muted/30",
        sizeClass,
        className
      )}
      title="Unassigned"
    >
      <span className="text-[10px]">?</span>
    </div>
  );
}

export function AvatarStack({
  users,
  max = 3,
  size = "sm",
}: {
  users: { name?: string | null; image?: string | null }[];
  max?: number;
  size?: "sm" | "md";
}) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user, i) => (
        <OwnerAvatar key={i} {...user} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full bg-surface-hover flex items-center justify-center",
            "text-muted font-medium ring-2 ring-surface shrink-0",
            size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
