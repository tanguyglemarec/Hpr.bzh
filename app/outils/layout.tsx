import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Tri HPR",
  appleWebApp: {
    capable: true,
    title: "Tri HPR",
    statusBarStyle: "black-translucent",
  },
};

export default function OutilsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
