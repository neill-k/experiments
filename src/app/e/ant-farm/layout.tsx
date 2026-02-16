import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ant Farm",
  description: "A living ant colony simulation — watch ants dig tunnels, forage for food, and build an underground civilization.",
  openGraph: {
    title: "Ant Farm — Experiments",
    description: "A living ant colony simulation — watch ants dig tunnels, forage for food, and build an underground civilization.",
    url: "https://experiments.neillkillgore.com/e/ant-farm",
  },
  twitter: {
    card: "summary",
    title: "Ant Farm — Experiments",
    description: "A living ant colony simulation — watch ants dig tunnels, forage for food, and build an underground civilization.",
  },
};

export default function AntFarmLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
