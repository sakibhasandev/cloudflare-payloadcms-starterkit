import {
    ArrowRight,
    BookOpen,
    Cloud,
    Database,
    HardDrive,
    LayoutDashboard,
    Shield,
    Sparkles,
    Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const features = [
    {
        icon: Database,
        title: "Payload CMS",
        description:
            "Headless CMS with a Lexical rich-text editor and auto-generated TypeScript types.",
    },
    {
        icon: Cloud,
        title: "Cloudflare D1",
        description:
            "Serverless SQLite at the edge, wired up through Drizzle ORM and migrations.",
    },
    {
        icon: HardDrive,
        title: "R2 Storage",
        description:
            "Media uploads stored on Cloudflare R2 object storage with zero egress fees.",
    },
    {
        icon: Zap,
        title: "Next.js 16",
        description:
            "App Router with React Server Components, deployed to Workers via OpenNext.",
    },
    {
        icon: Shield,
        title: "Type-safe",
        description:
            "End-to-end types flow from your Payload collections straight into the UI.",
    },
    {
        icon: Sparkles,
        title: "shadcn/ui",
        description:
            "A full component library preinstalled and themed, ready to compose.",
    },
];

export default async function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center px-6 py-16 sm:py-24">
            <main className="flex w-full max-w-5xl flex-col gap-16">
                <section className="flex flex-col items-center gap-6 text-center">
                    <Badge variant="secondary">
                        <Sparkles data-icon="inline-start" />
                        Payload CMS × Cloudflare
                    </Badge>
                    <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                        The edge-native starter kit
                    </h1>
                    <p className="max-w-2xl text-base text-muted-foreground text-balance sm:text-lg">
                        A production-ready foundation pairing Payload CMS with
                        Cloudflare D1, R2, and Workers — fully typed and
                        deployable in minutes.
                    </p>
                    <div className="flex flex-col items-center gap-3 sm:flex-row">
                        <Button size="lg" asChild>
                            <a href="/admin">
                                <LayoutDashboard data-icon="inline-start" />
                                Open admin panel
                                <ArrowRight data-icon="inline-end" />
                            </a>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <a
                                href="https://payloadcms.com/docs"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <BookOpen data-icon="inline-start" />
                                Documentation
                            </a>
                        </Button>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map(({ icon: Icon, title, description }) => (
                        <Card key={title}>
                            <CardHeader>
                                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="size-5" />
                                </div>
                                <CardTitle>{title}</CardTitle>
                                <CardDescription>{description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </section>
            </main>

            <footer className="mt-16 flex w-full max-w-5xl flex-col gap-6">
                <Separator />
                <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
                    <p>
                        Edit{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                            src/app/(frontend)/page.tsx
                        </code>{" "}
                        to get started.
                    </p>
                    <div className="flex items-center gap-1">
                        <Button variant="link" size="sm" asChild>
                            <a
                                href="https://nextjs.org/docs"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Next.js
                            </a>
                        </Button>
                        <Button variant="link" size="sm" asChild>
                            <a
                                href="https://developers.cloudflare.com"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Cloudflare
                            </a>
                        </Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
