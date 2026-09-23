import { apiFetch } from "@/lib/api/client";

export type IntegrationHealth = {
  whatsapp: {
    configured: boolean;
    lastWebhookAt: string | null;
    recentErrorCount: number;
  };
  openai: {
    configured: boolean;
    provider: string;
    model: string;
  };
  googleMaps: {
    configured: boolean;
  };
};

export function fetchIntegrationsHealth(): Promise<IntegrationHealth> {
  return apiFetch<IntegrationHealth>("/integrations/health");
}
