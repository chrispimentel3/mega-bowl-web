import type { Metadata } from "next";
import { Inter, Archivo_Narrow } from "next/font/google";
import { getHeadshots } from "@/lib/headshots";
import { getSchedule } from "@/lib/schedule";
import { HeadshotsProvider } from "@/components/HeadshotsProvider";
import { PlayerCardProvider } from "@/components/PlayerCardProvider";
import { ScheduleProvider } from "@/components/ScheduleTag";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const archivo = Archivo_Narrow({
  variable: "--font-archivo",
  weight: ["600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mega Bowl",
  description: "Mega Bowl command center — what to do this week, ranked by what it adds to your starting nine.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [headshots, schedule] = await Promise.all([getHeadshots(), getSchedule()]);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <HeadshotsProvider headshots={headshots}>
          <ScheduleProvider schedule={schedule}>
            <PlayerCardProvider>{children}</PlayerCardProvider>
          </ScheduleProvider>
        </HeadshotsProvider>
      </body>
    </html>
  );
}
