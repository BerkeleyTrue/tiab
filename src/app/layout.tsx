import "@/styles/globals.css";

import { type Metadata } from "next";
import localFont from "next/font/local";

import { TRPCReactProvider } from "@/trpc/react";
import { NavBar } from "@/components/nav-bar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "TIAB",
  description: "A simple inventory management system",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const font = localFont({
  src: [
    {
      path: "./fonts/FiraCode-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/FiraCode-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/FiraCode-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${font.className}`}>
      <body>
        <TRPCReactProvider>
          <div className="flex min-h-dvh w-dvw bg-gradient-to-b from-[var(--ctp-base)] to-[var(--ctp-lavender)]">
            <NavBar />
            <main
              className={cn(
                "flex w-full flex-col items-center justify-center md:w-[calc(100%-calc(var(--spacing)*24))]",
                "pb-16 md:m-2 md:pb-0",
                "bg-[var(--ctp-surface1)] md:rounded-xl md:shadow",
              )}
            >
              <div
                className={cn(
                  "container flex h-full flex-col items-center gap-12 justify-center",
                  "py-1 md:px-4 md:py-16",
                )}
              >
                {children}
              </div>
            </main>
          </div>
        </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
