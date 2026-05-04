import { notFound, redirect } from "next/navigation";
import { ReportExperience } from "@/components/report-experience";
import { getSessionRuntime } from "@/lib/store";

export default async function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const runtime = await getSessionRuntime(sessionId);

  if (!runtime.session) {
    notFound();
  }

  if (!runtime.report) {
    redirect(`/processing/${sessionId}`);
  }

  return <ReportExperience report={runtime.report} />;
}
