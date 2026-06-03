"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiKeyConfiguration } from "@/types/jerry";

type SettingsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { theme, setTheme } = useTheme();
    const [apiKeys, setApiKeys] = useState<ApiKeyConfiguration>({
        openai: false,
        anthropic: false,
    });
    const [openaiDraft, setOpenaiDraft] = useState("");
    const [savingKey, setSavingKey] = useState(false);
    const [keyError, setKeyError] = useState<string | null>(null);
    const [keySaved, setKeySaved] = useState(false);

    const loadSettings = useCallback(async () => {
        if (!window.jerry?.settings) return;

        const [themeResult, configuredResult] = await Promise.all([
            window.jerry.settings.get("theme"),
            window.jerry.settings.isConfigured(),
        ]);

        if (themeResult.ok && (themeResult.data === "light" || themeResult.data === "dark")) {
            setTheme(themeResult.data);
        }
        if (configuredResult.ok) {
            setApiKeys(configuredResult.data);
        }
        setOpenaiDraft("");
        setKeyError(null);
        setKeySaved(false);
    }, [setTheme]);

    useEffect(() => {
        if (open) {
            void loadSettings();
        }
    }, [open, loadSettings]);

    const handleThemeChange = async (value: string) => {
        const next = value === "light" ? "light" : "dark";
        setTheme(next);
        if (!window.jerry?.settings) return;
        await window.jerry.settings.set("theme", next);
    };

    const handleSaveOpenAiKey = async () => {
        const trimmed = openaiDraft.trim();
        if (!trimmed) {
            setKeyError("Enter an API key to save.");
            return;
        }
        if (!window.jerry?.settings) {
            setKeyError("Settings are only available in the Electron app.");
            return;
        }

        setSavingKey(true);
        setKeyError(null);
        const result = await window.jerry.settings.set("openaiApiKey", trimmed);
        setSavingKey(false);

        if (!result.ok) {
            setKeyError(result.error);
            return;
        }

        setOpenaiDraft("");
        setKeySaved(true);
        const configured = await window.jerry.settings.isConfigured();
        if (configured.ok) {
            setApiKeys(configured.data);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-md"
            >
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <DialogTitle>Settings</DialogTitle>
                            <DialogDescription>
                                Appearance and API keys for Jerry.
                            </DialogDescription>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0"
                            aria-label="Close settings"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="size-4" aria-hidden="true" />
                        </Button>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="appearance" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                        <TabsTrigger value="api-keys">API keys</TabsTrigger>
                    </TabsList>

                    <TabsContent value="appearance" className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="theme-select">Theme</Label>
                            <Select
                                value={theme === "light" ? "light" : "dark"}
                                onValueChange={(value) => void handleThemeChange(value)}
                            >
                                <SelectTrigger id="theme-select" className="w-full">
                                    <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="light">Light</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>

                    <TabsContent value="api-keys" className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="openai-api-key">OpenAI</Label>
                                {apiKeys.openai && (
                                    <Badge variant="secondary" className="text-xs">
                                        Key saved
                                    </Badge>
                                )}
                            </div>
                            <Input
                                id="openai-api-key"
                                type="password"
                                autoComplete="off"
                                placeholder={
                                    apiKeys.openai
                                        ? "Enter a new key to replace"
                                        : "sk-..."
                                }
                                value={openaiDraft}
                                onChange={(e) => {
                                    setOpenaiDraft(e.target.value);
                                    setKeySaved(false);
                                    setKeyError(null);
                                }}
                            />
                            <p className="text-muted-foreground text-xs">
                                Stored locally on your Mac. Used for chat only.
                            </p>
                            {keyError && (
                                <p className="text-destructive text-sm" role="alert">
                                    {keyError}
                                </p>
                            )}
                            {keySaved && (
                                <p className="text-muted-foreground text-sm">
                                    OpenAI API key saved.
                                </p>
                            )}
                            <Button
                                type="button"
                                size="sm"
                                disabled={savingKey || !openaiDraft.trim()}
                                onClick={() => void handleSaveOpenAiKey()}
                            >
                                {savingKey ? "Saving…" : "Save OpenAI key"}
                            </Button>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="anthropic-api-key" className="text-muted-foreground">
                                    Anthropic
                                </Label>
                                <Badge variant="outline" className="text-xs">
                                    Coming soon
                                </Badge>
                            </div>
                            <Input
                                id="anthropic-api-key"
                                type="password"
                                disabled
                                placeholder="Not available yet"
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
