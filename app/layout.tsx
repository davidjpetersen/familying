import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import ServiceWorkerRegistrar from './components/ServiceWorkerRegistrar';
import { ThemeProvider } from './lib/contexts/theme-context';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Familying.org",
  description: "Empowering Families with Tailored Resources and Support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "var(--cl-color-primary)",
          colorBackground: "var(--cl-color-background)",
          colorInputBackground: "var(--cl-color-input)",
          colorInputText: "var(--cl-color-foreground)",
          colorText: "var(--cl-color-foreground)",
          colorTextSecondary: "var(--cl-color-muted-foreground)",
          colorTextOnPrimaryBackground: "var(--cl-color-primary-foreground)",
          colorNeutral: "var(--cl-color-border)",
          colorShimmer: "var(--cl-color-muted)",
          borderRadius: "var(--cl-radius)",
          spacingUnit: "1rem",
        },
        elements: {
          card: {
            backgroundColor: "var(--cl-color-card)",
            border: "1px solid var(--cl-color-border)",
            boxShadow: "var(--cl-shadow-medium)",
          },
          headerTitle: {
            color: "var(--cl-color-foreground)",
          },
          headerSubtitle: {
            color: "var(--cl-color-muted-foreground)",
          },
          socialButtonsBlockButton: {
            backgroundColor: "var(--cl-color-secondary)",
            border: "1px solid var(--cl-color-border)",
            color: "var(--cl-color-secondary-foreground)",
            "&:hover": {
              backgroundColor: "var(--cl-color-accent)",
            },
          },
          formButtonPrimary: {
            backgroundColor: "var(--cl-color-primary)",
            color: "var(--cl-color-primary-foreground)",
            "&:hover": {
              backgroundColor: "var(--cl-color-primary)",
              opacity: "0.9",
            },
          },
          formFieldInput: {
            backgroundColor: "var(--cl-color-input)",
            border: "1px solid var(--cl-color-border)",
            color: "var(--cl-color-foreground)",
            "&:focus": {
              borderColor: "var(--cl-color-primary)",
            },
          },
          footer: {
            backgroundColor: "var(--cl-color-background)",
            "& p": {
              color: "var(--cl-color-muted-foreground)",
            },
            "& a": {
              color: "var(--cl-color-primary)",
              "&:hover": {
                color: "var(--cl-color-primary)",
                opacity: "0.8",
              },
            },
          },
          userButtonPopoverCard: {
            backgroundColor: "var(--cl-color-card)",
            border: "1px solid var(--cl-color-border)",
            boxShadow: "var(--cl-shadow-large)",
          },
          userButtonPopoverActionButton: {
            color: "var(--cl-color-foreground)",
            "&:hover": {
              backgroundColor: "var(--cl-color-accent)",
            },
          },
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900`}
        >
          <ThemeProvider>
            <ServiceWorkerRegistrar />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
