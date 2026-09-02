"use client";

import { StreamProvider } from "@/components/stream/context/StreamContext";


export default function StreamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StreamProvider>
      {children}
    </StreamProvider>
  );
}