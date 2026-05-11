import Link from "next/link";
import { revalidatePath } from "next/cache";
import { listFeedbackRecords, updateFeedbackRecordStatus } from "@/lib/benyuan-v3-store";
import type { BenyuanFeedbackRecord, BenyuanFeedbackStatus } from "@/lib/benyuan-v3-types";

const STATUS_LABELS: Record<BenyuanFeedbackStatus, string> = {
  new: "待处理",
  processing: "处理中",
  completed: "已完成",
  declined: "不处理",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as BenyuanFeedbackStatus[];

async function updateFeedbackStatusAction(formData: FormData) {
  "use server";

  const feedbackId = String(formData.get("feedback_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (feedbackId && STATUS_OPTIONS.includes(status as BenyuanFeedbackStatus)) {
    await updateFeedbackRecordStatus(feedbackId, status as BenyuanFeedbackStatus);
    revalidatePath("/lab/feedback");
  }
}

function asSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

function normalizeStatus(value: string | null) {
  return value && STATUS_OPTIONS.includes(value as BenyuanFeedbackStatus) ? (value as BenyuanFeedbackStatus) : undefined;
}

function buildStatusHref(status?: BenyuanFeedbackStatus) {
  return status ? `/lab/feedback?status=${status}` : "/lab/feedback";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function countByStatus(records: BenyuanFeedbackRecord[]) {
  return records.reduce<Record<BenyuanFeedbackStatus, number>>(
    (acc, record) => {
      const status = record.status ?? "new";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    { new: 0, processing: 0, completed: 0, declined: 0 },
  );
}

function StatusBadge({ status }: { status: BenyuanFeedbackStatus }) {
  const tone =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : status === "processing"
        ? "bg-blue-50 text-blue-700 ring-blue-100"
        : status === "declined"
          ? "bg-stone-100 text-stone-500 ring-stone-200"
          : "bg-amber-50 text-amber-700 ring-amber-100";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tone}`}>{STATUS_LABELS[status]}</span>;
}

function StatusActionButtons({ record }: { record: BenyuanFeedbackRecord }) {
  const currentStatus = record.status ?? "new";

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {STATUS_OPTIONS.map((status) => (
        <form key={status} action={updateFeedbackStatusAction}>
          <input type="hidden" name="feedback_id" value={record.feedback_id} />
          <input type="hidden" name="status" value={status} />
          <button
            type="submit"
            disabled={currentStatus === status}
            className={`rounded px-2.5 py-1.5 text-xs font-medium ring-1 transition ${
              currentStatus === status
                ? "cursor-default bg-stone-900 text-white ring-stone-900"
                : "bg-white text-stone-700 ring-stone-200 hover:bg-stone-50"
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        </form>
      ))}
    </div>
  );
}

export default async function FeedbackLabPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedStatus = normalizeStatus(asSingleValue(resolvedSearchParams.status));
  const allRecords = await listFeedbackRecords({ limit: 500 });
  const records = await listFeedbackRecords({ status: selectedStatus, limit: 200 });
  const statusCounts = countByStatus(allRecords);

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8 text-stone-950">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">internal feedback</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950">反馈管理</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">只保留用户意见、处理进度和操作；这里不是 App 用户界面。</p>
          </div>
          <Link href="/lab/test-plan" className="rounded bg-white px-3 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100">
            测试任务清单
          </Link>
        </header>

        <section className="mt-5 flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4">
          <span className="mr-1 text-sm font-medium text-stone-500">处理总览</span>
          <Link
            href={buildStatusHref()}
            className={`rounded px-3 py-2 text-sm font-medium ring-1 ${
              selectedStatus ? "bg-white text-stone-700 ring-stone-200" : "bg-stone-900 text-white ring-stone-900"
            }`}
          >
            全部 {allRecords.length}
          </Link>
          {STATUS_OPTIONS.map((status) => (
            <Link
              key={status}
              href={buildStatusHref(status)}
              className={`rounded px-3 py-2 text-sm font-medium ring-1 ${
                selectedStatus === status ? "bg-stone-900 text-white ring-stone-900" : "bg-white text-stone-700 ring-stone-200"
              }`}
            >
              {STATUS_LABELS[status]} {statusCounts[status] ?? 0}
            </Link>
          ))}
        </section>

        <section className="mt-5 overflow-x-auto border border-stone-200 bg-white">
          {records.length === 0 ? (
            <div className="px-5 py-10 text-sm text-stone-500">当前筛选下没有反馈。</div>
          ) : (
            <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
              <thead className="bg-stone-100 text-sm font-medium text-stone-600">
                <tr>
                  <th className="w-[58%] border-b border-stone-200 px-4 py-3">反馈意见</th>
                  <th className="w-[14%] border-b border-stone-200 px-4 py-3">处理进度</th>
                  <th className="w-[28%] border-b border-stone-200 px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const status = record.status ?? "new";
                  return (
                    <tr key={record.feedback_id} className="border-b border-stone-100 align-top last:border-b-0">
                      <td className="px-4 py-4">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-stone-950">{record.message}</p>
                        <p className="mt-2 text-xs text-stone-500">{formatTimestamp(record.created_at)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusActionButtons record={record} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
