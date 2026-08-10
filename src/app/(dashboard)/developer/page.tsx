"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/context/dashboard-context";
import { 
  Key, 
  Plus, 
  Trash2, 
  Loader, 
  Check, 
  Copy, 
  Terminal, 
  Webhook, 
  ShieldAlert
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiKeys, generateApiKey, revokeApiKey, ApiKeyRecord } from "@/lib/actions/api-key";
import { cn } from "@/lib/utils/cn";

export default function DeveloperSettingsPage() {
  const { sessionToken, user } = useDashboard();
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks" | "integrations">("keys");

  // Keys states
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [copiedKeySuccess, setCopiedKeySuccess] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Load API keys
  useEffect(() => {
    async function loadApiKeys() {
      if (!sessionToken) {
        setApiKeys([]);
        setLoadingKeys(false);
        return;
      }
      setLoadingKeys(true);
      try {
        const res = await getApiKeys(sessionToken);
        if (res.ok && res.data) {
          setApiKeys(res.data);
        }
      } catch (err) {
        console.error("Could not load API keys:", err);
      } finally {
        setLoadingKeys(false);
      }
    }
    void loadApiKeys();
  }, [sessionToken]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !sessionToken) return;
    setIsCreatingKey(true);
    setKeyError(null);

    const res = await generateApiKey(newKeyName, sessionToken);
    setIsCreatingKey(false);
    if (res.ok && res.data) {
      setApiKeys((prev) => [res.data!.keyRecord, ...prev]);
      setGeneratedKey(res.data.plainTextKey);
      setNewKeyName("");
    } else {
      setKeyError(res.error ?? "Failed to generate API key.");
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!sessionToken) return;
    setRevokingKeyId(id);
    setKeyError(null);

    const res = await revokeApiKey(id, sessionToken);
    setRevokingKeyId(null);
    if (res.ok) {
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } else {
      setKeyError(res.error ?? "Failed to revoke API key.");
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-normal text-fg">Developer Settings</h1>
        <p className="text-xs text-muted-fg mt-1">Configure programmatic API keys, webhook integrations, and REST endpoints.</p>
      </div>

      {keyError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-300 text-sm shadow-sm">
          {keyError}
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex gap-4 border-b border-border/50 pb-2">
        <button
          onClick={() => setActiveTab("keys")}
          className={cn(
            "text-xs font-semibold pb-2 border-b-2 transition-all cursor-pointer",
            activeTab === "keys" ? "border-brand-500 text-fg" : "border-transparent text-muted-fg hover:text-fg"
          )}
        >
          API Keys
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={cn(
            "text-xs font-semibold pb-2 border-b-2 transition-all cursor-pointer",
            activeTab === "webhooks" ? "border-brand-500 text-fg" : "border-transparent text-muted-fg hover:text-fg"
          )}
        >
          Webhooks
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={cn(
            "text-xs font-semibold pb-2 border-b-2 transition-all cursor-pointer",
            activeTab === "integrations" ? "border-brand-500 text-fg" : "border-transparent text-muted-fg hover:text-fg"
          )}
        >
          Integrations
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === "keys" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Keys list */}
          <Card className="lg:col-span-2 p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-normal text-fg flex items-center gap-2">
              <Key className="h-5 w-5 text-brand-500" />
              <span>API Credentials</span>
            </h3>
            <p className="text-xs text-muted-fg leading-relaxed">
              Use API keys to access SwiftPoll poll statistics, audit logs, and response details via HTTPS.
            </p>

            {generatedKey && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/20 dark:text-amber-300 text-xs space-y-2">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  ⚠️ API Key Generated Successfully!
                </p>
                <p className="text-[10px] leading-relaxed">
                  Make sure to copy this key now. We won&apos;t show it to you again for security reasons.
                </p>
                <div className="flex gap-2 mt-1">
                  <Input
                    readOnly
                    value={generatedKey}
                    className="text-[10px] h-9 font-mono bg-pure-white select-all text-black"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(generatedKey);
                      setCopiedKeySuccess(true);
                      setTimeout(() => setCopiedKeySuccess(false), 2000);
                    }}
                    className="text-xs h-9 px-3 flex gap-1 items-center cursor-pointer"
                  >
                    {copiedKeySuccess ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKeySuccess ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGeneratedKey(null)}
                  className="text-[10px] w-full text-center mt-1 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                >
                  Done (I have saved it)
                </Button>
              </div>
            )}

            {loadingKeys ? (
              <div className="py-12 flex justify-center"><Loader className="h-6 w-6 animate-spin text-brand-500" /></div>
            ) : apiKeys.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-fg border border-dashed rounded-xl bg-subtle/20">
                No API keys generated yet.
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-subtle/30 text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-fg">{key.name}</p>
                      <p className="text-[10px] text-muted-fg font-mono mt-0.5">
                        {key.masked_key}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={revokingKeyId === key.id}
                      onClick={() => handleRevokeKey(key.id)}
                      className="h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-500/10 hover:border-red-500/20"
                    >
                      {revokingKeyId === key.id ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Key Generator */}
          {user && (
            <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
              <h3 className="font-serif text-base font-semibold text-fg flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-brand-500" />
                <span>Create Key</span>
              </h3>
              <p className="text-xs text-muted-fg leading-relaxed">
                Generate a new key. Choose a unique name so you can track its usage.
              </p>
              <form onSubmit={handleGenerateKey} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="key-name" className="text-xs font-semibold text-fg">Key Name</label>
                  <Input
                    id="key-name"
                    placeholder="e.g. production-client"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="text-xs h-10 w-full"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isCreatingKey || !newKeyName.trim()}
                  className="w-full h-10 cursor-pointer"
                >
                  {isCreatingKey ? <Loader className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Generate Key
                </Button>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === "webhooks" && (
        <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-normal text-fg flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-400" />
            <span>Webhook Secrets & Dispatchers</span>
          </h3>
          <p className="text-xs text-muted-fg leading-relaxed">
            Register webhook endpoints inside the **Advanced Options** drawer of individual polls to dispatch response notifications to your servers in real-time.
          </p>

          <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs flex gap-3 items-start text-muted-fg">
            <Terminal className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-fg">Webhook Dispatch payload format:</p>
              <pre className="p-3 bg-black/40 rounded-lg text-[10px] font-mono leading-relaxed overflow-x-auto text-gray-300">
{`{
  "event": "vote.created",
  "poll_slug": "favorite-database-123",
  "option_id": "98ea85ab-23ba...",
  "option_text": "Supabase / PostgreSQL",
  "total_votes": 42
}`}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* Integrations Tab */}
      {activeTab === "integrations" && (
        <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-normal text-fg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-400" />
            <span>Developer Integrations & Rate Limits</span>
          </h3>
          <p className="text-xs text-muted-fg leading-relaxed">
            REST API calls are subject to standard developer quota locks:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold pt-2 text-muted-fg">
            <div className="p-3 rounded-xl border border-border bg-subtle/30">
              <p className="text-fg font-serif text-sm font-semibold">100 req / minute</p>
              <p className="text-[10px] font-medium text-muted-fg mt-0.5">REST API client read rate limits</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-subtle/30">
              <p className="text-fg font-serif text-sm font-semibold">10 webhooks / poll</p>
              <p className="text-[10px] font-medium text-muted-fg mt-0.5">Active webhook subscriptions</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
