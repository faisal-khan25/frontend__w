import { useEffect, useRef, useState } from "react";
import statusApi from "../lib/statusApi";
import socketService from "../lib/socketService";

export function useEmployeeStatuses(userIds) {
  const [statuses, setStatuses] = useState({});
  const knownIdsRef = useRef(new Set());

  useEffect(() => {
    const newIds = (userIds || []).filter((id) => id && !knownIdsRef.current.has(id));
    if (!newIds.length) return;
    newIds.forEach((id) => knownIdsRef.current.add(id));

    statusApi
      .getBulkStatuses(newIds)
      .then((map) => {
        setStatuses((prev) => ({
          ...prev,
          ...Object.fromEntries(newIds.map((id) => [id, map[id] || null])),
        }));
      })
      .catch(() => {
      });
  }, [userIds]);

  useEffect(() => {
    function applyIfTracked(userId, value) {
      if (!knownIdsRef.current.has(userId)) return;
      setStatuses((prev) => ({ ...prev, [userId]: value }));
    }

    function onUpdated({ userId, status }) {
      applyIfTracked(userId, status || null);
    }
    function onCleared({ userId }) {
      applyIfTracked(userId, null);
    }
    function onExpired({ userId }) {
      applyIfTracked(userId, null);
    }

    socketService.on("status:updated", onUpdated);
    socketService.on("status:cleared", onCleared);
    socketService.on("status:expired", onExpired);
    return () => {
      socketService.off("status:updated", onUpdated);
      socketService.off("status:cleared", onCleared);
      socketService.off("status:expired", onExpired);
    };
  }, []);

  return statuses;
}

export default useEmployeeStatuses;