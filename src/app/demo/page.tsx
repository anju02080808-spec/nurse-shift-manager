import type { Metadata } from "next";
import ShiftManager from "@/components/ShiftManager";

export const metadata: Metadata = {
  title: "デモを試す | Nurse Shift Manager",
  description:
    "アカウント登録なしで看護師向け勤務表アプリの主要機能を試せるデモです。",
};

export default function DemoPage() {
  return <ShiftManager demoMode />;
}
