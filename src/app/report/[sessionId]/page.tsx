import { notFound } from "next/navigation";
import { ReportExperience } from "@/components/report-experience";
import { getReport } from "@/lib/store";

export default async function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const report = await getReport(sessionId);

  if (!report) {
    notFound();
  }

  return <ReportExperience report={report} />;
}
