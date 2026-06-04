import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Payload CMS × Cloudflare Starter",
    description:
        "An edge-native starter kit pairing Payload CMS with Cloudflare D1, R2, and Workers — fully typed and deployable in minutes.",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable}`}
        >
            <head>
                <link
                    rel="icon"
                    href="/favicon.svg"
                    type="image/svg+xml"
                ></link>
            </head>
            <body className="antialiased">
                <TooltipProvider>{children}</TooltipProvider>
            </body>
        </html>
    );
}
