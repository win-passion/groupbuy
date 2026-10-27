import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import DeadlineRunner from "./components/DeadlineRunner";
import DevPanel from "./components/DevPanel";
import "./globals.css";

/** Friendly geometric sans for all UI text (variable font, 200–800). */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GroupBuy",
  description: "Buy together, pay less.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <DeadlineRunner />
        <DevPanel />
      </body>
    </html>
  );
}
