"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyCaptcha } from "@/lib/captcha";
import { generateEditToken, hashEditToken, isWellFormedToken } from "@/lib/edit-token";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { err, ok, type Result } from "@/lib/result";
import { defaultLocale, isLocale } from "@/i18n/config";
import type { Json } from "@/lib/types/database.types";
import {
  listingFormSchema,
  submissionSchema,
  type ListingFormInput,
  type SubmissionValues,
} from "../schemas";
import { editLinkEmail } from "./emails";

/**
 * Shared secret that proves a write came through these server actions (captcha
 * and IP rate limiting) rather than straight at the REST API. Optional locally.
 */
const submitGate = () => process.env.SUBMIT_GATE_SECRET ?? "";

function listingPayload(values: ListingFormInput): Json {
  return {
    type: values.type,
    price: values.price,
    neighborhood: values.neighborhood || null,
    municipality: values.municipality,
    lat: values.lat,
    lng: values.lng,
    flatmates: values.flatmates ?? null,
    preferred_gender: values.preferred_gender,
    description: values.description,
    available_from: values.available_from || null,
    bills_included: values.bills_included,
    deposit: values.deposit ?? null,
    room_type: values.type === "room" ? (values.room_type ?? null) : null,
    pets: values.pets,
    smokers: values.smokers,
    tenant_pref: values.tenant_pref,
    contact_external: values.contact_external || null,
    contact_whatsapp: values.contact_whatsapp || null,
    contact_email: values.contact_email || null,
    bathrooms: values.bathrooms ?? null,
    bedrooms: values.type === "full_flat" ? (values.bedrooms ?? null) : null,
    photos: values.photos,
  };
}

function mapDbError(message: string): string {
  if (message.includes("rate_limited")) return "errors.rateLimited";
  if (message.includes("not_found")) return "errors.notFound";
  if (message.includes("contact_required")) return "errors.contactRequired";
  if (message.includes("invalid_status_transition")) return "errors.unauthorized";
  return "errors.generic";
}

export type CreatedListing = {
  id: string;
  /** Plain edit token; only ever shown to the poster. */
  token: string;
  /** True when the edit link was also sent by email. */
  emailed: boolean;
};

export async function createListing(
  input: SubmissionValues,
  locale: string,
): Promise<Result<CreatedListing>> {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) return err("errors.validation");

  // Honeypot: pretend it worked so bots do not learn anything.
  if (parsed.data.website) {
    return ok({ id: crypto.randomUUID(), token: generateEditToken(), emailed: false });
  }

  const ip = await getClientIp();
  if (!(await checkRateLimit("publish", ip))) return err("errors.rateLimited");
  if (!(await verifyCaptcha(parsed.data.captcha_token, ip))) return err("errors.captcha");

  const token = generateEditToken();
  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("submit_listing", {
    p_gate: submitGate(),
    p_token_hash: hashEditToken(token),
    p_payload: listingPayload(parsed.data),
  });

  if (error || !id) {
    console.error("createListing failed:", error);
    return err(mapDbError(error?.message ?? ""));
  }

  // The edit link is emailed only when the poster gave an email; it is always
  // shown on screen too.
  let emailed = false;
  if (parsed.data.contact_email) {
    const safeLocale = isLocale(locale) ? locale : defaultLocale;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const mail = editLinkEmail(safeLocale, `${siteUrl}/${safeLocale}/manage/${id}/${token}`);
    emailed = await sendEmail({ to: parsed.data.contact_email, ...mail });
  }

  return ok({ id, token, emailed });
}

export async function updateListing(
  id: string,
  token: string,
  input: ListingFormInput,
): Promise<Result<{ id: string }>> {
  if (!isWellFormedToken(token)) return err("errors.notFound");

  const parsed = listingFormSchema.safeParse(input);
  if (!parsed.success) return err("errors.validation");

  if (!(await checkRateLimit("edit", await getClientIp()))) return err("errors.rateLimited");

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_listing_by_token", {
    p_gate: submitGate(),
    p_id: id,
    p_token_hash: hashEditToken(token),
    p_payload: listingPayload(parsed.data),
  });

  if (error) {
    console.error("updateListing failed:", error);
    return err(mapDbError(error.message));
  }

  revalidatePath("/[locale]", "page");
  return ok({ id });
}

export type PosterStatusAction = "deactivate" | "republish" | "delete";

export async function setListingStatus(
  id: string,
  token: string,
  action: PosterStatusAction,
): Promise<Result<null>> {
  if (!isWellFormedToken(token)) return err("errors.notFound");

  if (!(await checkRateLimit("edit", await getClientIp()))) return err("errors.rateLimited");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_listing_status_by_token", {
    p_gate: submitGate(),
    p_id: id,
    p_token_hash: hashEditToken(token),
    p_action: action,
  });

  if (error) {
    console.error(`setListingStatus ${action} failed:`, error);
    return err(mapDbError(error.message));
  }

  revalidatePath("/[locale]", "page");
  return ok(null);
}
