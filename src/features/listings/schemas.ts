import { z } from "zod";
import { isInSpain } from "@/lib/geo";

const optionalInt = (max: number) =>
  z.coerce.number().int().min(0).max(max).optional().nullable();

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .pipe(z.string().url().nullable());

const listingShape = {
    type: z.enum(["room", "full_flat"]),
    lat: z.number().min(-90, "validation").max(90, "validation"),
    lng: z.number().min(-180, "validation").max(180, "validation"),
    neighborhood: z.string().trim().max(100, "validation").optional().nullable(),
    municipality: z.string().trim().min(1, "validation").max(100, "validation"),
    price: z.coerce.number().int().min(50, "validation").max(20000, "validation"),
    description: z.string().trim().min(20, "validation").max(2000, "validation"),
    available_from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "validation")
      .optional()
      .nullable()
      .or(z.literal("").transform(() => null)),
    bills_included: z.boolean(),
    deposit: optionalInt(100000),
    flatmates: optionalInt(30),
    preferred_gender: z.enum(["any", "female", "male", "non_binary"]),
    room_type: z.enum(["single", "double", "shared"]).optional().nullable(),
    pets: z.boolean(),
    smokers: z.boolean(),
    tenant_pref: z.enum(["any", "students", "workers"]),
    bathrooms: optionalInt(10),
    bedrooms: optionalInt(20),
    contact_whatsapp: z
      .string()
      .trim()
      .max(25)
      .optional()
      .nullable()
      .transform((v) => (v ? v : null))
      .pipe(
        z
          .string()
          .regex(/^\+?[0-9][0-9 ]{6,20}$/, "validation")
          .nullable(),
      ),
    /** Public contact email, shown on the listing. Optional. */
    contact_email: z
      .string()
      .trim()
      .toLowerCase()
      .max(200, "validation")
      .optional()
      .nullable()
      .transform((v) => (v ? v : null))
      .pipe(z.string().email("validation").nullable()),
    contact_external: optionalUrl,
    photos: z
      .array(
        z
          .string()
          .min(1)
          .max(300)
          .startsWith("anon/")
          .refine((v) => !v.includes(".."), "validation"),
      )
      .min(1, "firstPhotoRequired")
      .max(8, "tooManyPhotos"),
};

const listingObject = z.object(listingShape);

function refineListing(val: z.infer<typeof listingObject>, ctx: z.RefinementCtx) {
  if (!isInSpain(val.lat, val.lng)) {
    ctx.addIssue({ code: "custom", path: ["lat"], message: "outsideSpain" });
  }
  if (val.type === "room" && !val.room_type) {
    ctx.addIssue({ code: "custom", path: ["room_type"], message: "validation" });
  }
  if (val.type === "full_flat" && !val.bedrooms) {
    ctx.addIssue({ code: "custom", path: ["bedrooms"], message: "validation" });
  }
  // At least one public contact: WhatsApp or email. The external link is optional.
  if (!val.contact_whatsapp && !val.contact_email) {
    ctx.addIssue({ code: "custom", path: ["contact_whatsapp"], message: "contactRequired" });
  }
}

/** Listing content (what the poster can edit). */
export const listingFormSchema = listingObject.superRefine(refineListing);

export type ListingFormInput = z.infer<typeof listingFormSchema>;
export type ListingFormValues = z.input<typeof listingFormSchema>;

/** New anonymous submission: listing content + contact email + anti-abuse fields. */
export const submissionSchema = z
  .object({
    ...listingShape,
    /** Private: where the edit link is sent. Independent from the public contact. */
    internal_email: z
      .string()
      .trim()
      .toLowerCase()
      .max(200, "validation")
      .email("validation"),
    accept_terms: z.literal(true, { errorMap: () => ({ message: "validation" }) }),
    /** Honeypot: real users never fill it. */
    website: z.string().max(200).optional(),
    captcha_token: z.string().max(4096).optional(),
  })
  .superRefine(refineListing);

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type SubmissionValues = z.input<typeof submissionSchema>;

export const rejectSchema = z.object({
  comment: z.string().trim().min(3, "validation").max(1000, "validation"),
});
export type RejectInput = z.infer<typeof rejectSchema>;
