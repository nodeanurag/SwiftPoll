import type { Metadata } from "next";
import { Inter, Playfair_Display, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import { HeaderFooterManager } from "../components/layout/header-footer-manager";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SwiftPoll — instant live polls, no sign-up",
    template: "%s · SwiftPoll",
  },
  description:
    "Create a poll, share the link, and watch results update live in real time. No accounts, no friction.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "SwiftPoll",
    description: "Instant live polls. No sign-up.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const raw = localStorage.getItem('sb-wiipmjganpkvvybofwvj-auth-token');
                if (raw && window.location.pathname === '/') {
                  window.location.replace('/dashboard');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <HeaderFooterManager>
            {children}
          </HeaderFooterManager>
        </ThemeProvider>
      </body>
    </html>
  );
}
