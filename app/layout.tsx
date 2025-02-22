import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Job Application Tracker",
  description: "Track and manage your job applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* If you're toggling dark mode by adding 'dark' class to <html>, 
          you can do so here or dynamically in your dark mode toggle. */}
      <body
        className={`
          ${inter.className} 
          min-h-screen w-full 
          bg-gray-100 dark:bg-gray-900 
          text-gray-900 dark:text-gray-100
          m-0 p-0 
          transition-colors
        `}
      >
        {/* 
          Removed container-based classes like mx-auto, px-4, py-8 to eliminate page padding. 
          'children' can still have their own spacing if needed. 
        */}
        {children}
      </body>
    </html>
  );
}

