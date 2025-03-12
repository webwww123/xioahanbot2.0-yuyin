import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并classnames的工具函数
 * 使用clsx和tailwind-merge合并className
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 