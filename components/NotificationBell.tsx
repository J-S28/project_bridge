"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, type NotificationFilter } from "@/lib/useNotifications";

export function NotificationBell({ filter }: { filter: NotificationFilter | null }) {
  const { appUser } = useAuth();
  const [open, setOpen] = useState(false);
  const { items, unreadCount, markRead } = useNotifications(filter, appUser?.uid);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-full border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 max-w-[90vw] rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {items.length === 0 && (
            <p className="p-2 text-sm text-neutral-500">No notifications yet.</p>
          )}
          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {items.map((n) => {
              const unread = !n.readBy.includes(appUser?.uid ?? "");
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={`block w-full rounded-lg p-2 text-left text-xs ${
                    unread ? "bg-neutral-100 dark:bg-neutral-800" : ""
                  }`}
                >
                  <p>{n.message}</p>
                  <p className="mt-1 text-neutral-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
