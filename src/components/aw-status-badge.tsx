"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

type AwStatus = "checking" | "connected" | "disconnected" | "unavailable";

export function AwStatusBadge() {
    const [status, setStatus] = useState<AwStatus>("checking");
    const [detail, setDetail] = useState<string | undefined>();

    const refresh = useCallback(async () => {
        if (!window.jerry?.aw?.checkConnection) {
            setStatus("unavailable");
            setDetail("ActivityWatch status is only available in the Electron app.");
            return;
        }

        const result = await window.jerry.aw.checkConnection();

        if (!result.ok) {
            setStatus("disconnected");
            setDetail(result.error);
            return;
        }

        if (result.data.connected) {
            setStatus("connected");
            setDetail("ActivityWatch connected");
            return;
        }

        setStatus("disconnected");
        setDetail(result.data.error ?? "ActivityWatch disconnected");
    }, []);

    useEffect(() => {
        void refresh();
        const id = window.setInterval(() => void refresh(), POLL_MS);
        return () => window.clearInterval(id);
    }, [refresh]);

    const indicatorClass =
        status === "connected"
            ? "bg-green-500"
            : status === "checking"
              ? "bg-muted-foreground animate-pulse"
              : "bg-red-500";

    return (
        <Badge
            variant="secondary"
            className="flex items-center gap-1.5 bg-background/90 px-2 py-1 backdrop-blur-sm"
            title={detail}
        >
            {status === "checking" ? (
                <Loader2
                    className="size-3 shrink-0 animate-spin text-muted-foreground"
                    aria-hidden="true"
                />
            ) : (
                <span
                    className={cn("size-2 shrink-0 rounded-full", indicatorClass)}
                    aria-hidden="true"
                />
            )}
            <Activity className="size-3 shrink-0" aria-hidden="true" />
            <span className="text-xs">AW</span>
            <span className="sr-only">
                {status === "connected"
                    ? "ActivityWatch connected"
                    : status === "checking"
                      ? "Checking ActivityWatch connection"
                      : status === "unavailable"
                        ? "ActivityWatch status unavailable"
                        : "ActivityWatch disconnected"}
            </span>
        </Badge>
    );
}
