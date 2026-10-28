import { describe, expect, it } from "vitest";
import { draftDescription, parseDraft } from "./publish-draft";

describe("parseDraft", () => {
  it("keeps a well-formed draft", () => {
    const draft = { price: 380, description: "Hola", photos: ["data:image/webp;base64,AAA"] };
    expect(parseDraft(draft)).toEqual(draft);
  });

  it("drops anything that is not an image data URL", () => {
    const draft = parseDraft({
      price: 380,
      description: "Hola",
      photos: ["https://example.com/x.png", "javascript:alert(1)", 3],
    });
    expect(draft?.photos).toEqual([]);
  });

  it("ignores garbage and empty drafts", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("text")).toBeNull();
    expect(parseDraft({ price: "380", description: "  ", photos: [] })).toBeNull();
  });
});

describe("draftDescription", () => {
  it("joins headline and message, skipping blanks", () => {
    expect(draftDescription(" Habitación libre ", "¡Escríbeme!")).toBe(
      "Habitación libre\n\n¡Escríbeme!",
    );
    expect(draftDescription("Habitación libre", "  ")).toBe("Habitación libre");
  });
});
