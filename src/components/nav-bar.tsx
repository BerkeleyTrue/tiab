"use client";

import { Bone, Home, Settings, TreePine } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { usePathname } from "next/navigation";

export const NavBar = () => {
  const path = usePathname();

  const navItems = [
    { label: "Home", icon: Home, route: "/" },
    { label: "Items", icon: Bone, route: "/items" },
    { label: "Containers", icon: TreePine, route: "/containers" },
    { label: "Settings", icon: Settings, route: "/settings" },
  ];

  const isActive = useCallback(
    (route: string) => {
      // Exact match for home page
      if (route === "/" && path === "/") {
        return true;
      }
      // For other routes, check if the current path starts with the route
      // This handles nested routes like /weight/add still highlighting the Weight nav item
      return route !== "/" && path.startsWith(route);
    },
    [path],
  );

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-[var(--border)] bg-[var(--card)] py-3 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.route}
            className={cn(
              "flex cursor-pointer flex-col items-center",
              isActive(item.route)
                ? "text-[var(--primary)]"
                : "text-[var(--muted-foreground)]",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="mt-1 text-xs">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Desktop Sidebar */}
      <div className="h-dvh flex-1 w-24 flex-col items-center py-8 hidden md:flex">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.route}
            className={cn(
              "mb-8 flex cursor-pointer flex-col items-center",
              isActive(item.route)
                ? "text-[var(--primary)]"
                : "text-[var(--muted-foreground)]",
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="mt-1 text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
};
