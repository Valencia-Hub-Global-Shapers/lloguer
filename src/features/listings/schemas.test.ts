import { describe, expect, it } from "vitest";
import { listingFormSchema, submissionSchema } from "./schemas";

const validRoom = {
  type: "room",
  lat: 39.47,
  lng: -0.37,
  neighborhood: "Russafa",
  municipality: "València",
  price: 450,
  description: "Habitación luminosa en piso compartido, muy céntrica.",
  available_from: "2026-08-01",
  bills_included: true,
  deposit: null,
  flatmates: 2,
  preferred_gender: "any",
  room_type: "double",
  pets: false,
  smokers: false,
  tenant_pref: "any",
  bathrooms: 1,
  bedrooms: null,
  contact_whatsapp: "+34 600 123 456",
  contact_external: "",
  contact_email: "",
  photos: ["anon/draft/photo1.webp"],
};

describe("listingFormSchema", () => {
  it("accepts a valid room listing", () => {
    const result = listingFormSchema.safeParse(validRoom);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contact_external).toBeNull();
      expect(result.data.contact_whatsapp).toBe("+34 600 123 456");
    }
  });

  it("accepts a full flat with only an email as contact", () => {
    const result = listingFormSchema.safeParse({
      ...validRoom,
      type: "full_flat",
      room_type: null,
      bedrooms: 3,
      contact_whatsapp: "",
      contact_email: " Poster@Example.com ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.contact_email).toBe("poster@example.com");
  });

  it("requires WhatsApp or email; an external link alone is not enough", () => {
    const none = { ...validRoom, contact_whatsapp: "", contact_email: "" };
    expect(listingFormSchema.safeParse(none).success).toBe(false);
    expect(
      listingFormSchema.safeParse({ ...none, contact_external: "https://example.com/anuncio" })
        .success,
    ).toBe(false);
  });

  it("rejects a malformed email even when WhatsApp is given", () => {
    expect(listingFormSchema.safeParse({ ...validRoom, contact_email: "nope" }).success).toBe(
      false,
    );
  });

  it("treats the external link as optional", () => {
    const r = listingFormSchema.safeParse({ ...validRoom, contact_external: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.contact_external).toBeNull();
  });

  it("rejects a room without room_type", () => {
    const result = listingFormSchema.safeParse({ ...validRoom, room_type: null });
    expect(result.success).toBe(false);
  });

  it("rejects a full flat without bedrooms", () => {
    const result = listingFormSchema.safeParse({
      ...validRoom,
      type: "full_flat",
      room_type: null,
      bedrooms: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects listings without any contact method", () => {
    const result = listingFormSchema.safeParse({
      ...validRoom,
      contact_whatsapp: "",
      contact_external: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty photos with firstPhotoRequired", () => {
    const result = listingFormSchema.safeParse({ ...validRoom, photos: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("firstPhotoRequired");
    }
  });

  it("rejects more than 8 photos with tooManyPhotos", () => {
    const result = listingFormSchema.safeParse({
      ...validRoom,
      photos: Array.from({ length: 9 }, (_, i) => `p/${i}.webp`),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("tooManyPhotos");
    }
  });

  it("rejects invalid whatsapp numbers", () => {
    const result = listingFormSchema.safeParse({
      ...validRoom,
      contact_whatsapp: "abc",
      contact_external: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects impossible coordinates", () => {
    expect(listingFormSchema.safeParse({ ...validRoom, lat: 91 }).success).toBe(false);
    expect(listingFormSchema.safeParse({ ...validRoom, lng: -181 }).success).toBe(false);
  });

  it("coerces numeric strings from form inputs", () => {
    const result = listingFormSchema.safeParse({
      ...validRoom,
      price: "500",
      flatmates: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(500);
  });
});

describe("listing location", () => {
  it("accepts listings anywhere in Spain", () => {
    for (const [lat, lng, municipality] of [
      [40.42, -3.7, "Madrid"],
      [41.39, 2.17, "Barcelona"],
      [28.12, -15.43, "Las Palmas de Gran Canaria"],
    ] as const) {
      const r = listingFormSchema.safeParse({ ...validRoom, lat, lng, municipality });
      expect(r.success).toBe(true);
    }
  });

  it("rejects coordinates outside Spain", () => {
    const r = listingFormSchema.safeParse({ ...validRoom, lat: 48.86, lng: 2.35 });
    expect(r.success).toBe(false);
  });

  it("makes the neighborhood optional but the municipality required", () => {
    expect(listingFormSchema.safeParse({ ...validRoom, neighborhood: "" }).success).toBe(true);
    expect(listingFormSchema.safeParse({ ...validRoom, neighborhood: null }).success).toBe(true);
    expect(listingFormSchema.safeParse({ ...validRoom, municipality: "" }).success).toBe(false);
  });
});

describe("submissionSchema", () => {
  const submission = { ...validRoom, accept_terms: true };

  it("accepts an anonymous submission with WhatsApp only", () => {
    expect(submissionSchema.safeParse(submission).success).toBe(true);
  });

  it("accepts an anonymous submission with email only", () => {
    const result = submissionSchema.safeParse({
      ...submission,
      contact_whatsapp: "",
      contact_email: "  Poster@Example.com ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.contact_email).toBe("poster@example.com");
  });

  it("needs at least one of WhatsApp or email", () => {
    expect(
      submissionSchema.safeParse({ ...submission, contact_whatsapp: "", contact_email: "" })
        .success,
    ).toBe(false);
  });

  it("requires accepting the terms", () => {
    expect(submissionSchema.safeParse({ ...submission, accept_terms: false }).success).toBe(
      false,
    );
  });

  it("only allows photos from the anonymous upload folder", () => {
    expect(
      submissionSchema.safeParse({ ...submission, photos: ["someone-else/draft/a.webp"] })
        .success,
    ).toBe(false);
    expect(
      submissionSchema.safeParse({ ...submission, photos: ["anon/../secret.webp"] }).success,
    ).toBe(false);
  });
});
