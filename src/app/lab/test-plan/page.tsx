import Link from "next/link";
import { revalidatePath } from "next/cache";
import { listFeedbackRecords, listTestPlanItems, updateTestPlanItemStatus } from "@/lib/benyuan-v3-store";
import type {
  BenyuanFeedbackRecord,
  BenyuanTestPlanExecutionState,
  BenyuanTestPlanItem,
  BenyuanTestPlanSource,
  BenyuanTestPlanStatus,
} from "@/lib/benyuan-v3-types";

const STATUS_LABELS: Record<BenyuanTestPlanStatus, string> = {
  pending: "待测试",
  testing: "测试中",
  needs_fix: "需修复",
  passed: "已通过",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as BenyuanTestPlanStatus[];

const SOURCE_LABELS: Record<BenyuanTestPlanSource, string> = {
  system_regression: "系统回归项",
  feedback_derived: "真实反馈生成",
};

const EXECUTION_LABELS: Record<BenyuanTestPlanExecutionState, string> = {
  implemented_needs_verification: "已实现，待回归",
  needs_hardening: "继续加固",
  blocked_external_resources: "等外部资料",
};

async function updateTestPlanStatusAction(formData: FormData) {
  "use server";

  const itemId = String(formData.get("test_plan_item_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (itemId && STATUS_OPTIONS.includes(status as BenyuanTestPlanStatus)) {
    await updateTestPlanItemStatus(itemId, status as BenyuanTestPlanStatus);
    revalidatePath("/lab/test-plan");
  }
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

function countByStatus(items: BenyuanTestPlanItem[]) {
  return items.reduce<Record<BenyuanTestPlanStatus, number>>(
    (acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    },
    { pending: 0, testing: 0, needs_fix: 0, passed: 0 },
  );
}

function linkedFeedbackCount(item: BenyuanTestPlanItem, feedbackRecords: BenyuanFeedbackRecord[]) {
  const keywords = item.feedback_keywords.map((keyword) => keyword.toLocaleLowerCase("zh-CN"));
  return feedbackRecords.filter((record) => {
    const message = record.message.toLocaleLowerCase("zh-CN");
    return keywords.some((keyword) => message.includes(keyword));
  }).length;
}

function StatusBadge({ status }: { status: BenyuanTestPlanStatus }) {
  const tone =
    status === "passed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : status === "testing"
        ? "bg-blue-50 text-blue-700 ring-blue-100"
        : status === "needs_fix"
          ? "bg-rose-50 text-rose-700 ring-rose-100"
          : "bg-amber-50 text-amber-700 ring-amber-100";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tone}`}>{STATUS_LABELS[status]}</span>;
}

function SourceBadge({ source }: { source: BenyuanTestPlanSource }) {
  return <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200">{SOURCE_LABELS[source]}</span>;
}

function ExecutionBadge({ state }: { state: BenyuanTestPlanExecutionState }) {
  const tone =
    state === "implemented_needs_verification"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : state === "blocked_external_resources"
        ? "bg-stone-100 text-stone-500 ring-stone-200"
        : "bg-violet-50 text-violet-700 ring-violet-100";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tone}`}>{EXECUTION_LABELS[state]}</span>;
}

function StatusActionButtons({ item }: { item: BenyuanTestPlanItem }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((status) => (
        <form key={status} action={updateTestPlanStatusAction}>
          <input type="hidden" name="test_plan_item_id" value={item.test_plan_item_id} />
          <input type="hidden" name="status" value={status} />
          <button
            type="submit"
            disabled={item.status === status}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ring-1 transition ${
              item.status === status
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

export default async function TestPlanPage() {
  const [items, feedbackRecords] = await Promise.all([listTestPlanItems(), listFeedbackRecords({ limit: 500 })]);
  const statusCounts = countByStatus(items);

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8 text-stone-950">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-stone-200 pb-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">internal test plan</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950">测试任务清单</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            这里是系统回归项，不是虚拟用户反馈。真实用户反馈只进入反馈管理；这张表用于把 App 已实现待回归、继续加固和外部资料阻塞的任务集中推进。真实反馈命中只是关键词命中数量。
          </p>
        </header>

        <section className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white">全部 {items.length}</span>
          {STATUS_OPTIONS.map((status) => (
            <span key={status} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-200">
              {STATUS_LABELS[status]} {statusCounts[status] ?? 0}
            </span>
          ))}
          <Link href="/lab/feedback" className="rounded-md bg-white px-3 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50">
            反馈管理
          </Link>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
          <div className="grid grid-cols-[minmax(220px,0.9fr)_120px_140px_minmax(240px,1fr)_100px_330px] gap-4 border-b border-stone-200 bg-stone-100 px-5 py-3 text-sm font-medium text-stone-600">
            <div>测试项</div>
            <div>当前状态</div>
            <div>工程定位</div>
            <div>验证方式</div>
            <div>真实反馈命中</div>
            <div>操作</div>
          </div>

          {items.map((item) => (
            <div key={item.test_plan_item_id} className="grid grid-cols-[minmax(220px,0.9fr)_120px_140px_minmax(240px,1fr)_100px_330px] gap-4 border-b border-stone-100 px-5 py-4 last:border-b-0">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-6 text-stone-950">{item.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SourceBadge source={item.source} />
                  <span className="text-xs text-stone-500">{item.area} / {formatTimestamp(item.updated_at)}</span>
                </div>
              </div>
              <div>
                <StatusBadge status={item.status} />
              </div>
              <div>
                <ExecutionBadge state={item.execution_state} />
              </div>
              <p className="text-sm leading-6 text-stone-700">{item.verification}</p>
              <div className="text-sm font-medium text-stone-950">{linkedFeedbackCount(item, feedbackRecords)}</div>
              <StatusActionButtons item={item} />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
