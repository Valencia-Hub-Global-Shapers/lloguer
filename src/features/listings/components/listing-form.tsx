"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/field-label";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useI18n } from "@/i18n/client";
import { PinPickerMap } from "@/features/map/components/pin-picker-map";
import { reverseGeocode } from "@/features/map/geocode";
import { VALENCIA_CENTER } from "@/lib/utils";
import {
  listingFormSchema,
  submissionSchema,
  type SubmissionInput,
  type SubmissionValues,
} from "../schemas";
import { createListing, updateListing, type CreatedListing } from "../server/actions";
import { PhotoUploader } from "./photo-uploader";
import { captchaEnabled, TurnstileWidget } from "./turnstile";

const nullableNumber = {
  setValueAs: (v: unknown) => (v === "" || v == null ? null : Number(v)),
};

export function ListingForm({
  mode,
  listingId,
  token,
  defaults,
}: {
  mode: "create" | "edit";
  /** edit mode: the poster's secret edit token */
  listingId?: string;
  token?: string;
  defaults: SubmissionValues;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [created, setCreated] = useState<CreatedListing | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  // Edit mode only validates the listing content (no email/terms/captcha)
  const schema = mode === "create" ? submissionSchema : listingFormSchema;
  const form = useForm<SubmissionValues, unknown, SubmissionInput>({
    resolver: zodResolver(schema) as unknown as Resolver<
      SubmissionValues,
      unknown,
      SubmissionInput
    >,
    defaultValues: defaults,
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const type = watch("type");
  const lat = watch("lat");
  const lng = watch("lng");

  // Fill municipality/neighborhood from the pin. Both stay editable: the lookup
  // can fail (no token, offline, a spot without a named neighborhood).
  const geocodeRequest = useRef(0);
  const fillPlaceFromPin = async (pinLat: number, pinLng: number) => {
    const request = ++geocodeRequest.current;
    const place = await reverseGeocode(pinLat, pinLng);
    if (!place || request !== geocodeRequest.current) return;
    if (place.country && place.country !== "es") {
      form.setError("lat", { message: "outsideSpain" });
      return;
    }
    form.clearErrors("lat");
    setValue("municipality", place.municipality ?? "", { shouldValidate: true });
    setValue("neighborhood", place.neighborhood ?? "");
  };

  // New listings start on the default map position: detect its place too
  useEffect(() => {
    if (mode === "create" && !form.getValues("municipality")) {
      void fillPlaceFromPin(form.getValues("lat"), form.getValues("lng"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPin = (newLat: number, newLng: number) => {
    setValue("lat", newLat, { shouldValidate: true });
    setValue("lng", newLng, { shouldValidate: true });
    void fillPlaceFromPin(newLat, newLng);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "create") {
      if (captchaEnabled && !captchaToken) {
        toast.error(t("errors.captcha"));
        return;
      }
      const result = await createListing(
        { ...values, captcha_token: captchaToken ?? undefined },
        locale,
      );
      if (!result.ok) {
        toast.error(t(result.error));
        // Turnstile tokens are single-use: ask for a fresh one so a retry works.
        setCaptchaToken(null);
        setCaptchaReset((n) => n + 1);
        return;
      }
      setCreated(result.data);
      window.scrollTo({ top: 0 });
      return;
    }

    const result = await updateListing(listingId!, token!, values);
    if (!result.ok) {
      toast.error(t(result.error));
      return;
    }
    toast.success(t("manage.saved"));
    router.refresh();
  });

  const fieldError = (key: string | undefined) =>
    key ? (
      <p className="text-destructive text-xs">
        {t(
          key === "validation" ? "errors.fieldInvalid" : key.includes(".") ? key : `errors.${key}`,
        )}
      </p>
    ) : null;

  if (created) {
    const editUrl = `${window.location.origin}/${locale}/manage/${created.id}/${created.token}`;
    return (
      <Card className="mx-auto mt-16 w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-3 p-8">
          <CheckCircle2 className="text-primary size-10" />
          <h1 className="text-xl font-bold tracking-tight">{t("publish.successTitle")}</h1>
          <p className="text-muted-foreground text-sm">{t("publish.successDescription")}</p>
          <div className="bg-muted w-full rounded-lg p-3 text-left">
            <p className="mb-1 text-xs font-semibold">{t("publish.editLinkTitle")}</p>
            <p className="text-muted-foreground mb-2 text-xs">
              {created.emailed ? t("publish.editLinkEmailed") : t("publish.editLinkSaveIt")}
            </p>
            <p className="font-mono text-xs break-all">{editUrl}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(editUrl);
                toast.success(t("publish.linkCopied"));
              }}
            >
              <Copy />
              {t("publish.copyLink")}
            </Button>
            <Button onClick={() => router.push(editUrl)}>{t("publish.manageListing")}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto grid w-full max-w-2xl gap-6 p-4 pb-16">
      <h1 className="text-2xl font-bold tracking-tight">
        {mode === "create" ? t("publish.title") : t("publish.editTitle")}
      </h1>
      <p className="text-muted-foreground -mt-3 text-sm">
        <span className="text-primary">*</span> {t("publish.requiredNote")}
      </p>

      {/* 1. Type + location */}
      <Card>
        <CardHeader>
          <CardTitle>
            <SectionEyebrow index={1}>{t("publish.stepLocation")}</SectionEyebrow>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <FieldLabel required>{t("publish.type")}</FieldLabel>
            <ToggleGroup
              type="single"
              value={type}
              onValueChange={(v) => {
                if (v === "room" || v === "full_flat") setValue("type", v);
              }}
            >
              <ToggleGroupItem value="full_flat">{t("listing.typeFullFlat")}</ToggleGroupItem>
              <ToggleGroupItem value="room">{t("listing.typeRoom")}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid gap-1.5">
            <FieldLabel required>{t("publish.dropPin")}</FieldLabel>
            <PinPickerMap lat={lat} lng={lng} onChange={onPin} />
            {fieldError(errors.lat?.message || errors.lng?.message)}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="municipality" required>
                  {t("publish.municipality")}
                </FieldLabel>
                <Input id="municipality" autoComplete="off" {...register("municipality")} />
                {fieldError(errors.municipality?.message)}
              </div>
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="neighborhood" optional>
                  {t("publish.neighborhood")}
                </FieldLabel>
                <Input id="neighborhood" autoComplete="off" {...register("neighborhood")} />
                {fieldError(errors.neighborhood?.message)}
              </div>
            </div>
            <p className="text-muted-foreground text-xs">{t("publish.placeHint")}</p>
            <input type="hidden" {...register("lat", { valueAsNumber: true })} />
            <input type="hidden" {...register("lng", { valueAsNumber: true })} />
          </div>
        </CardContent>
      </Card>

      {/* 2. Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            <SectionEyebrow index={2}>{t("publish.stepDetails")}</SectionEyebrow>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="price" required>
                {t("publish.price")}
              </FieldLabel>
              <Input id="price" type="number" min={0} inputMode="numeric" {...register("price")} />
              {fieldError(errors.price?.message)}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="available_from" optional>
                {t("publish.availableFrom")}
              </FieldLabel>
              <Input id="available_from" type="date" {...register("available_from")} />
              {fieldError(errors.available_from?.message)}
            </div>
          </div>

          <div className="grid gap-1.5">
            <FieldLabel htmlFor="description" required>
              {t("publish.description")}
            </FieldLabel>
            <Textarea
              id="description"
              rows={5}
              placeholder={t("publish.descriptionPlaceholder")}
              {...register("description")}
            />
            {fieldError(errors.description?.message)}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {type === "room" ? (
              <>
                <div className="grid gap-1.5">
                  <FieldLabel required>{t("publish.roomType")}</FieldLabel>
                  <Select
                    value={watch("room_type") ?? ""}
                    onValueChange={(v) =>
                      setValue("room_type", v as "single" | "double" | "shared", {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">{t("listing.roomSingle")}</SelectItem>
                      <SelectItem value="double">{t("listing.roomDouble")}</SelectItem>
                      <SelectItem value="shared">{t("listing.roomShared")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldError(errors.room_type?.message)}
                </div>
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="flatmates" optional>
                    {t("publish.flatmates")}
                  </FieldLabel>
                  <Input
                    id="flatmates"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    {...register("flatmates", nullableNumber)}
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="bedrooms" required>
                  {t("publish.bedrooms")}
                </FieldLabel>
                <Input
                  id="bedrooms"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  {...register("bedrooms", nullableNumber)}
                />
                {fieldError(errors.bedrooms?.message)}
              </div>
            )}
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="bathrooms" optional>
                {t("publish.bathrooms")}
              </FieldLabel>
              <Input
                id="bathrooms"
                type="number"
                min={0}
                inputMode="numeric"
                {...register("bathrooms", nullableNumber)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <FieldLabel optional>{t("publish.preferredGender")}</FieldLabel>
              <Select
                value={watch("preferred_gender")}
                onValueChange={(v) =>
                  setValue("preferred_gender", v as SubmissionValues["preferred_gender"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("listing.genderAny")}</SelectItem>
                  <SelectItem value="female">{t("listing.genderFemale")}</SelectItem>
                  <SelectItem value="male">{t("listing.genderMale")}</SelectItem>
                  <SelectItem value="non_binary">{t("listing.genderNonBinary")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <FieldLabel optional>{t("publish.tenantPref")}</FieldLabel>
              <Select
                value={watch("tenant_pref")}
                onValueChange={(v) => setValue("tenant_pref", v as SubmissionValues["tenant_pref"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("listing.tenantAny")}</SelectItem>
                  <SelectItem value="students">{t("listing.tenantStudents")}</SelectItem>
                  <SelectItem value="workers">{t("listing.tenantWorkers")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="deposit" optional>
                {t("publish.deposit")}
              </FieldLabel>
              <Input
                id="deposit"
                type="number"
                min={0}
                inputMode="numeric"
                {...register("deposit", nullableNumber)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <FieldLabel optional>{t("publish.extras")}</FieldLabel>
          </div>
          <div className="-mt-2 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["bills_included", "publish.billsIncluded"],
                ["pets", "publish.pets"],
                ["smokers", "publish.smokers"],
              ] as const
            ).map(([key, labelKey]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <Label htmlFor={`form-${key}`} className="text-xs">
                  {t(labelKey)}
                </Label>
                <Switch
                  id={`form-${key}`}
                  checked={Boolean(watch(key))}
                  onCheckedChange={(checked) => setValue(key, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. Photos + contact */}
      <Card>
        <CardHeader>
          <CardTitle>
            <SectionEyebrow index={3}>{t("publish.stepPhotos")}</SectionEyebrow>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <FieldLabel required>{t("publish.photos")}</FieldLabel>
            <PhotoUploader
              value={watch("photos") ?? []}
              onChange={(paths) => setValue("photos", paths, { shouldValidate: true })}
            />
            {fieldError(errors.photos?.message as string | undefined)}
          </div>

          <fieldset className="grid gap-4 rounded-lg border p-4">
            <legend className="px-1 text-sm font-semibold">
              {t("publish.contactGroupTitle")} <span className="text-primary">*</span>
            </legend>
            <p className="text-muted-foreground -mt-2 text-xs">{t("publish.contactAtLeastOne")}</p>

            <div className="grid gap-1.5">
              <FieldLabel htmlFor="contact_whatsapp" note={t("publish.oneOfTwo")}>
                {t("publish.contactWhatsapp")}
              </FieldLabel>
              <Input
                id="contact_whatsapp"
                type="tel"
                placeholder="+34 600 000 000"
                {...register("contact_whatsapp")}
              />
              {fieldError(errors.contact_whatsapp?.message)}
            </div>

            <div className="grid gap-1.5">
              <FieldLabel htmlFor="contact_email" note={t("publish.oneOfTwo")}>
                {t("publish.email")}
              </FieldLabel>
              <Input
                id="contact_email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("contact_email")}
              />
              <p className="text-muted-foreground text-xs">{t("publish.emailHint")}</p>
              {fieldError(errors.contact_email?.message)}
            </div>
          </fieldset>

          <div className="grid gap-1.5">
            <FieldLabel htmlFor="contact_external" optional>
              {t("publish.contactExternal")}
            </FieldLabel>
            <Input
              id="contact_external"
              type="url"
              placeholder="https://…"
              {...register("contact_external")}
            />
            {fieldError(errors.contact_external?.message)}
          </div>
          <p className="text-muted-foreground text-xs">{t("publish.contactPublicHint")}</p>
        </CardContent>
      </Card>

      {mode === "create" ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <SectionEyebrow index={4}>{t("publish.stepSubmit")}</SectionEyebrow>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="internal_email" required>
                {t("publish.internalEmail")}
              </FieldLabel>
              <Input
                id="internal_email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("internal_email")}
              />
              <p className="text-muted-foreground text-xs">{t("publish.internalEmailHint")}</p>
              {fieldError(errors.internal_email?.message)}
            </div>

            {/* Honeypot: invisible to people, tempting to bots */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              {...register("website")}
            />

            <div className="flex items-start gap-2">
              <Checkbox
                id="accept_terms"
                checked={watch("accept_terms") === true}
                onCheckedChange={(checked) =>
                  setValue("accept_terms", (checked === true) as true, { shouldValidate: true })
                }
              />
              <Label htmlFor="accept_terms" className="text-sm leading-snug font-normal">
                {t("publish.acceptTerms")}{" "}
                <Link href={`/${locale}/legal`} target="_blank" className="text-brand underline">
                  {t("publish.legalLink")}
                </Link>
                <span aria-hidden className="text-primary ml-0.5">
                  *
                </span>
                <span className="sr-only"> ({t("common.required")})</span>
              </Label>
            </div>
            {fieldError(errors.accept_terms?.message)}

            <TurnstileWidget onToken={setCaptchaToken} resetSignal={captchaReset} />
          </CardContent>
        </Card>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting
          ? t("common.loading")
          : mode === "create"
            ? t("publish.submit")
            : t("publish.submitEdit")}
      </Button>
    </form>
  );
}

export const createDefaults: SubmissionValues = {
  type: "room",
  lat: VALENCIA_CENTER[1],
  lng: VALENCIA_CENTER[0],
  neighborhood: "",
  municipality: "",
  price: undefined as unknown as number,
  description: "",
  available_from: "",
  bills_included: false,
  deposit: null,
  flatmates: null,
  preferred_gender: "any",
  room_type: "single",
  pets: false,
  smokers: false,
  tenant_pref: "any",
  bathrooms: 1,
  bedrooms: null,
  contact_whatsapp: "",
  contact_external: "",
  photos: [],
  contact_email: "",
  internal_email: "",
  accept_terms: false as unknown as true,
  website: "",
};
