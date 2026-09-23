"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TrackingSettingsCard } from "@/components/settings/tracking-settings-card";
import { company } from "@/data/mock";
import {
  fetchIntegrationsHealth,
  type IntegrationHealth,
} from "@/lib/api/integrations";
import { calculateFare, cn, formatRwf } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

const SECTIONS = [
  { id: "company", label: "Company Profile" },
  { id: "branding", label: "Branding" },
  { id: "operational", label: "Operational" },
  { id: "pricing", label: "Transport / Pricing" },
  { id: "billing", label: "Billing" },
  { id: "notifications", label: "Notifications" },
  { id: "users", label: "Users & Roles" },
  { id: "security", label: "Security" },
  { id: "tracking", label: "Tracking & Maps" },
  { id: "integrations", label: "Integrations" },
] as const;

export default function SettingsPage() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("company");
  const [profile, setProfile] = useState({
    name: company.name,
    phone: company.phone,
    email: company.email,
    address: company.address,
    timezone: company.timezone,
    currency: company.currency,
  });
  const [pricing, setPricing] = useState({
    firstKm: 500,
    additionalKm: 400,
    previewKm: 6.3,
  });

  const farePreview = useMemo(
    () => calculateFare(Number(pricing.previewKm) || 0),
    [pricing.previewKm],
  );

  const [integrationsHealth, setIntegrationsHealth] = useState<IntegrationHealth | null>(null);
  const [integrationsError, setIntegrationsError] = useState<string | null>(null);

  useEffect(() => {
    if (section !== "integrations") return;
    let cancelled = false;
    void fetchIntegrationsHealth()
      .then((health) => {
        if (!cancelled) {
          setIntegrationsHealth(health);
          setIntegrationsError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setIntegrationsError(err instanceof Error ? err.message : "Backend unreachable");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Settings"
        description="Company configuration, pricing, and operational preferences."
      />

      {/* Mobile: dropdown + horizontal scroll */}
      <div className="lg:hidden space-y-3">
        <Select
          value={section}
          onChange={(e) => setSection(e.target.value as typeof section)}
        >
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "shrink-0 rounded-[8px] border px-3 py-1.5 text-xs font-medium transition-colors",
                section === s.id
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-text-secondary",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <Card padding="sm" className="hidden lg:block h-fit sticky top-4">
          <nav className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  "text-left rounded-[8px] px-3 py-2 text-sm font-medium transition-colors",
                  section === s.id
                    ? "bg-primary-soft text-primary"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text",
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="space-y-4">
          {section === "company" ? (
            <Card>
              <h2 className="text-base font-semibold text-text">Company Profile</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Legal and contact details shown on invoices and communications.
              </p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Company name" className="sm:col-span-2">
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  />
                </Field>
                <Field label="Address" className="sm:col-span-2">
                  <Textarea
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    rows={3}
                  />
                </Field>
                <Field label="Timezone">
                  <Select
                    value={profile.timezone}
                    onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}
                  >
                    <option value="Africa/Kigali">Africa/Kigali</option>
                    <option value="Africa/Nairobi">Africa/Nairobi</option>
                    <option value="UTC">UTC</option>
                  </Select>
                </Field>
                <Field label="Currency">
                  <Input value={profile.currency} disabled />
                </Field>
              </div>
              <div className="mt-5 flex justify-end">
                <Button size="sm">Save changes</Button>
              </div>
            </Card>
          ) : null}

          {section === "pricing" ? (
            <Card>
              <h2 className="text-base font-semibold text-text">Transport / Pricing</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Fare calculation used for trip estimates and invoices.
              </p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="First kilometre (RWF)">
                  <Input
                    type="number"
                    value={pricing.firstKm}
                    onChange={(e) =>
                      setPricing((p) => ({ ...p, firstKm: Number(e.target.value) }))
                    }
                  />
                </Field>
                <Field label="Additional km (RWF)">
                  <Input
                    type="number"
                    value={pricing.additionalKm}
                    onChange={(e) =>
                      setPricing((p) => ({ ...p, additionalKm: Number(e.target.value) }))
                    }
                  />
                </Field>
                <Field
                  label="Preview distance (km)"
                  hint="Uses built-in fare rule for live preview"
                  className="sm:col-span-2"
                >
                  <Input
                    type="number"
                    step="0.1"
                    value={pricing.previewKm}
                    onChange={(e) =>
                      setPricing((p) => ({ ...p, previewKm: Number(e.target.value) }))
                    }
                  />
                </Field>
              </div>

              <div className="mt-4 rounded-[10px] border border-amber-200 bg-warning-soft/40 px-3 py-2.5 text-xs text-text-secondary">
                Note: Preview totals use the platform fare helper (500 first km / 400 after).
                Editable fields above are saved for display; live calculation will sync when
                billing rules are connected.
              </div>

              <div className="mt-5 rounded-[10px] border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Fare preview · {pricing.previewKm} km
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">First km</dt>
                    <dd className="font-medium text-text">
                      {farePreview.firstKm > 0 ? "500 RWF" : "0 RWF"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">
                      Remaining {farePreview.remainingKm.toFixed(1)} km × 400
                    </dt>
                    <dd className="font-medium text-text">
                      {formatRwf(farePreview.remainingCost)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <dt className="font-semibold text-text">Estimated fare</dt>
                    <dd className="font-semibold text-primary">
                      {formatRwf(farePreview.total)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5 flex justify-end">
                <Button size="sm">Save pricing</Button>
              </div>
            </Card>
          ) : null}

          {section === "tracking" ? (
            <TrackingSettingsCard />
          ) : null}

          {section === "integrations" ? (
            <Card>
              <h2 className="text-base font-semibold text-text">Integrations</h2>
              <p className="mt-2 text-sm text-text-secondary">
                WhatsApp, OpenAI, and Google Maps connection status. Secrets are never shown —
                configure them in backend <code className="text-xs">.env</code>. See{" "}
                <code className="text-xs">backend/docs/WHATSAPP_AI_DISPATCH.md</code>.
              </p>

              {integrationsError ? (
                <p className="mt-4 text-sm text-danger">{integrationsError}</p>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    {
                      label: "WhatsApp",
                      ok: integrationsHealth?.whatsapp.configured,
                      detail: integrationsHealth
                        ? integrationsHealth.whatsapp.lastWebhookAt
                          ? `Last webhook ${new Date(integrationsHealth.whatsapp.lastWebhookAt).toLocaleString()}`
                          : "No webhook received yet"
                        : "Checking…",
                      extra:
                        integrationsHealth && integrationsHealth.whatsapp.recentErrorCount > 0
                          ? `${integrationsHealth.whatsapp.recentErrorCount} errors (24h)`
                          : null,
                    },
                    {
                      label: "OpenAI",
                      ok: integrationsHealth?.openai.configured,
                      detail: integrationsHealth
                        ? `${integrationsHealth.openai.provider} / ${integrationsHealth.openai.model}`
                        : "Checking…",
                      extra: null,
                    },
                    {
                      label: "Google Maps",
                      ok: integrationsHealth?.googleMaps.configured,
                      detail: integrationsHealth
                        ? integrationsHealth.googleMaps.configured
                          ? "Places + Routes + Geocoding"
                          : "Server key not set"
                        : "Checking…",
                      extra: null,
                    },
                  ] as const
                ).map((card) => (
                  <div
                    key={card.label}
                    className="rounded-[10px] border border-border p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text">{card.label}</p>
                      <span
                        className={
                          card.ok === true
                            ? "text-xs font-medium text-success"
                            : card.ok === false
                              ? "text-xs font-medium text-danger"
                              : "text-xs text-text-muted"
                        }
                      >
                        {card.ok === true
                          ? "Connected"
                          : card.ok === false
                            ? "Not configured"
                            : "…"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-text-secondary">{card.detail}</p>
                    {card.extra ? (
                      <p className="mt-1 text-xs text-danger">{card.extra}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[10px] border border-dashed border-border bg-surface-muted/40 p-4 text-sm text-text-secondary space-y-2">
                <p className="font-medium text-text">Paste slots</p>
                <p>
                  <code className="text-xs">WHATSAPP_ACCESS_TOKEN</code>,{" "}
                  <code className="text-xs">WHATSAPP_PHONE_NUMBER_ID</code>,{" "}
                  <code className="text-xs">WHATSAPP_APP_SECRET</code>
                </p>
                <p>
                  <code className="text-xs">OPENAI_API_KEY</code>,{" "}
                  <code className="text-xs">OPENAI_TRANSPORT_MODEL</code>,{" "}
                  <code className="text-xs">AI_PROVIDER=openai</code>
                </p>
                <p>
                  <code className="text-xs">GOOGLE_MAPS_API_KEY</code> (Places + Routes + Geocoding)
                </p>
                <p className="text-xs text-text-muted">
                  Webhooks: <code className="text-xs">/integrations/whatsapp/webhook</code> or{" "}
                  <code className="text-xs">/webhooks/whatsapp/webhook</code>
                </p>
              </div>
            </Card>
          ) : null}

          {section !== "company" &&
          section !== "pricing" &&
          section !== "tracking" &&
          section !== "integrations" ? (
            <Card>
              <h2 className="text-base font-semibold text-text">
                {SECTIONS.find((s) => s.id === section)?.label}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                This settings section is ready for configuration. Company Profile and Transport /
                Pricing are fully editable in this build.
              </p>
              <div className="mt-5 rounded-[10px] border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-text-muted">
                Additional controls for {SECTIONS.find((s) => s.id === section)?.label.toLowerCase()}{" "}
                will appear here.
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
