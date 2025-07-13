import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SessionProvider } from "next-auth/react";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { auth } from "@/auth";
import NextTopLoader from "nextjs-toploader";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";
import { fontHeading } from "@/lib/fonts";
import { siteConfig } from "@/config/site";
import Providers from "@/components/provider";

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL}`),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  keywords: [
    "nextjs",
    "react",
    "react server components",
    "shop",
    "wasshoes",
    "tailwind",
    "shadcn",
  ],
  authors: [
    {
      name: "mrr_falhalla",
      url: "https://portofolio-lyart-six.vercel.app/",
    },
  ],
  creator: "Irfin_Falah",
  openGraph: {
    type: "website",
    locale: "id",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og.jpg`],
    creator: "@mrr.falah",
  },
  icons: {
    // Ikon utama (favicons)
    icon: [
      {
        url: "/favicons/favicon.ico",
      },
      {
        url: "/favicons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicons/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
    ],
    // Apple Touch Icons
    apple: [
      {
        url: "/favicons/apple-icon-57x57.png",
        sizes: "57x57",
        type: "image/png",
      },
      {
        url: "/favicons/apple-icon-60x60.png",
        sizes: "60x60",
        type: "image/png",
      },
      {
        url: "/favicons/apple-icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        url: "/favicons/apple-icon-76x76.png",
        sizes: "76x76",
        type: "image/png",
      },
      {
        url: "/favicons/apple-icon-114x114.png",
        sizes: "114x114",
        type: "image/png",
      },
      {
        url: "/favicons/apple-icon-120x120.png",
        sizes: "120x120",
        type: "image/png",
      },
      {
        url: "/favicons/apple-icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        url: "/favicons/apple-icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        url: "/favicons/apple-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
      // apple-icon-precomposed.png biasanya ditangani oleh apple-icon.png atau yang lebih spesifik
      // Jika Anda ingin memasukkan apple-icon.png sebagai fallback umum:
      {
        url: "/favicons/apple-icon.png",
        type: "image/png",
      },
    ],
    // Ikon untuk Android dan MS (khusus)
    other: [
      {
        url: "/favicons/android-icon-36x36.png",
        sizes: "36x36",
        type: "image/png",
      },
      {
        url: "/favicons/android-icon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: "/favicons/android-icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        url: "/favicons/android-icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        url: "/favicons/android-icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        url: "/favicons/android-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/favicons/ms-icon-70x70.png",
        sizes: "70x70",
        type: "image/png",
      },
      {
        url: "/favicons/ms-icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        url: "/favicons/ms-icon-150x150.png",
        sizes: "150x150",
        type: "image/png",
      },
      {
        url: "/favicons/ms-icon-310x310.png",
        sizes: "310x310",
        type: "image/png",
      },
    ],
  },
  // Anda mungkin ingin menambahkan manifest jika menggunakan PWA
  manifest: "/favicons/manifest.json",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang="en">
        <body
          className={cn(
            "bg-background min-h-screen font-sans antialiased",
            GeistSans.variable,
            GeistMono.variable,
            fontHeading.variable,
          )}
        >
          <Toaster />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextTopLoader />
            <Providers>
              <NuqsAdapter>{children}</NuqsAdapter>
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
