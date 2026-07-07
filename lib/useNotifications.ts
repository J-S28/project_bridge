"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { markNotificationRead, type NotificationDoc } from "./notifications";
import type { Department, Role } from "./types";

export interface NotificationFilter {
  forRole: Role;
  citizenId?: string;
  department?: Department;
  ward?: string;
}

export function useNotifications(filter: NotificationFilter | null, uid: string | undefined) {
  const [items, setItems] = useState<NotificationDoc[]>([]);

  useEffect(() => {
    if (!filter || !uid) return;

    const clauses = [where("forRole", "==", filter.forRole)];
    if (filter.citizenId) clauses.push(where("citizenId", "==", filter.citizenId));
    if (filter.department) clauses.push(where("department", "==", filter.department));
    if (filter.ward) clauses.push(where("ward", "==", filter.ward));

    const q = query(collection(db, "notifications"), ...clauses);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as NotificationDoc
        );
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setItems(list.slice(0, 20));
      },
      // A listener error (e.g. rules not yet deployed) must never throw
      // uncaught — the bell just stays empty instead of breaking the page.
      () => setItems([])
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter?.forRole, filter?.citizenId, filter?.department, filter?.ward, uid]);

  const unreadCount = items.filter((n) => !n.readBy.includes(uid ?? "")).length;

  function markRead(id: string) {
    if (uid) markNotificationRead(id, uid);
  }

  return { items, unreadCount, markRead };
}
