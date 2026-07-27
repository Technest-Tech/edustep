"use client";

import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApiItem, NotificationCenterData, NotificationItem } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  CircleAlert,
  Coins,
  LoaderCircle,
  LifeBuoy,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Popover } from "radix-ui";

const notificationAppearance: Record<
  NotificationItem["type"],
  { icon: typeof Bell; className: string }
> = {
  follow_up: { icon: CircleAlert, className: "bg-amber-50 text-amber-700" },
  invoice: { icon: Coins, className: "bg-rose-50 text-rose-700" },
  session: { icon: CalendarClock, className: "bg-sky-50 text-sky-700" },
  expense: { icon: ClipboardCheck, className: "bg-amber-50 text-amber-700" },
  payroll: { icon: Coins, className: "bg-violet-50 text-violet-700" },
  academic_risk: { icon: ShieldAlert, className: "bg-rose-50 text-rose-700" },
  service_request: { icon: LifeBuoy, className: "bg-teal/10 text-teal" },
};

export function NotificationCenter() {
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      apiClient<ApiItem<NotificationCenterData>>("/api/v1/notifications"),
    refetchInterval: 60_000,
  });
  const data = query.data?.data;

  return (
    <Popover.Root onOpenChange={(open) => open && query.refetch()}>
      <Popover.Trigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="relative"
          aria-label="الإشعارات"
        >
          <Bell size={17} />
          {data?.unread_count ? (
            <>
              <span className="absolute left-2 top-2 size-2 rounded-full border-2 border-white bg-rose-500" />
              <span className="sr-only">{data.unread_count} تنبيهات</span>
            </>
          ) : null}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          dir="rtl"
          align="end"
          sideOffset={10}
          className="z-50 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-[0_22px_70px_rgba(11,36,84,.18)] outline-none"
        >
          <div className="flex items-center justify-between border-b border-navy/[0.06] px-4 py-4">
            <div>
              <h2 className="text-xs font-bold text-navy">مركز التنبيهات</h2>
              <p className="mt-1 text-[8px] text-slate">
                أهم ما يحتاج انتباهك الآن
              </p>
            </div>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="grid size-8 place-items-center rounded-lg bg-cloud text-slate transition hover:text-navy"
              aria-label="تحديث التنبيهات"
            >
              <RefreshCw size={14} className={query.isFetching ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="thin-scrollbar max-h-[430px] overflow-y-auto">
            {query.isLoading ? (
              <div className="grid min-h-40 place-items-center">
                <LoaderCircle size={22} className="animate-spin text-teal" />
              </div>
            ) : query.isError ? (
              <div className="p-6 text-center">
                <CircleAlert className="mx-auto text-rose-500" size={24} />
                <p className="mt-2 text-[10px] font-semibold text-navy">
                  تعذر تحميل التنبيهات
                </p>
              </div>
            ) : data?.items.length ? (
              <div className="divide-y divide-navy/[0.055]">
                {data.items.map((item) => {
                  const appearance = notificationAppearance[item.type];
                  const Icon = appearance.icon;

                  return (
                    <Popover.Close asChild key={item.id}>
                      <Link
                        href={item.href}
                        className="flex gap-3 px-4 py-3.5 transition hover:bg-cloud/70"
                      >
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-xl",
                            appearance.className,
                          )}
                        >
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold text-navy">
                              {item.title}
                            </span>
                            <span
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                item.severity === "urgent"
                                  ? "bg-rose-500"
                                  : item.severity === "warning"
                                    ? "bg-amber-500"
                                    : "bg-sky-500",
                              )}
                            />
                          </span>
                          <span className="mt-1 block truncate text-[9px] text-slate">
                            {item.description}
                          </span>
                          <span className="mt-1.5 block text-[8px] text-slate/75">
                            {relativeTime(item.occurred_at)}
                          </span>
                        </span>
                      </Link>
                    </Popover.Close>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Bell size={19} />
                </div>
                <p className="mt-3 text-[10px] font-semibold text-navy">
                  كل شيء تحت السيطرة
                </p>
                <p className="mt-1 text-[8px] text-slate">
                  لا توجد تنبيهات تحتاج إجراء حاليًا.
                </p>
              </div>
            )}
          </div>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
