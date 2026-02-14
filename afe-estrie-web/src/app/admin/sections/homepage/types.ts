export type ToastType = "success" | "error";
export type Toast = { type: ToastType; msg: string } | null;
export type ContactBlock = {
  enabled?: boolean;
  mapEmbedUrl?: string;
  orgName?: string;
  email?: string;
  address?: string;
  directionsUrl?: string;
  hours?: { label: string; value: string }[];
  phones?: { label?: string; value: string }[];
};