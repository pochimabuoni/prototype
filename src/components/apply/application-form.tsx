"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, type ApplicationData, type ApplicationInput } from "@/lib/validation/application";
import { submitApplication } from "@/actions/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { AvailabilityGrid } from "@/components/forms/availability-grid";
import { SportPicker, type SportOption } from "@/components/forms/sport-picker";
import { NeighborhoodSelect } from "@/components/forms/neighborhood-select";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/validation/common";

export function ApplicationForm({ sports, defaultEmail }: { sports: SportOption[]; defaultEmail?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<ApplicationInput, unknown, ApplicationData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      email: defaultEmail ?? "",
      dateOfBirth: "",
      neighborhood: "" as ApplicationInput["neighborhood"],
      occupation: "",
      sports: [],
      availability: [],
      introduction: "",
      motivation: "",
      referralCode: "",
      agreeToTerms: false as unknown as true,
    },
    mode: "onBlur",
  });
  const { register, control, handleSubmit, formState, setError } = form;
  const [emailValue, introduction, motivation] = useWatch({ control, name: ["email", "introduction", "motivation"] });
  const errors = formState.errors;
  const err = (path: string): string | undefined => {
    const parts = path.split(".");
    let node: unknown = errors;
    for (const p of parts) node = (node as Record<string, unknown> | undefined)?.[p];
    return (node as { message?: string } | undefined)?.message;
  };

  const onSubmit = (data: ApplicationData) => {
    setServerError(null);
    if (photoError) return;
    const fd = new FormData();
    fd.set("payload", JSON.stringify(data));
    if (photo) fd.set("photo", photo);
    startTransition(async () => {
      const result = await submitApplication(fd);
      if (result.ok) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setServerError(result.error);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (field === "photo") setPhotoError(message);
        else setError(field as keyof ApplicationInput, { message });
      }
    });
  };

  if (submitted) {
    return (
      <div className="border border-border bg-card p-8 sm:p-12">
        <p className="eyebrow">Application received</p>
        <h2 className="display mt-6 text-4xl sm:text-5xl">Thank you.</h2>
        <p className="mt-6 max-w-lg text-lg text-graphite/80">
          Your application is with our membership team. We&apos;ve sent a confirmation to <strong>{emailValue}</strong>, and
          we&apos;ll write again as soon as a decision has been made.
        </p>
        <Button asChild variant="outline" className="mt-10">
          <Link href="/application-status">Check application status</Link>
        </Button>
      </div>
    );
  }

  const introLength = introduction?.length ?? 0;
  const motivationLength = motivation?.length ?? 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-16">
      {serverError ? <Alert variant="destructive">{serverError}</Alert> : null}

      <Fieldset number="01" title="About you">
        <div className="grid gap-8 sm:grid-cols-2">
          <FormField id="fullName" label="Full name" required error={err("fullName")}>
            <Input id="fullName" autoComplete="name" aria-invalid={!!err("fullName")} {...register("fullName")} />
          </FormField>
          <FormField id="email" label="Email" required error={err("email")} hint="We'll send our decision here.">
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!err("email")} {...register("email")} />
          </FormField>
          <FormField id="dateOfBirth" label="Date of birth" required error={err("dateOfBirth")} hint="Members must be 18 or older. Never shown to other members.">
            <Input id="dateOfBirth" type="date" autoComplete="bday" aria-invalid={!!err("dateOfBirth")} {...register("dateOfBirth")} />
          </FormField>
          <FormField id="neighborhood" label="NYC neighbourhood" required error={err("neighborhood")} hint="Neighbourhood only — we never ask for an address.">
            <NeighborhoodSelect id="neighborhood" aria-invalid={!!err("neighborhood")} {...register("neighborhood")} />
          </FormField>
          <FormField id="occupation" label="Occupation or university" error={err("occupation")} className="sm:col-span-2">
            <Input id="occupation" autoComplete="organization-title" placeholder="Optional" {...register("occupation")} />
          </FormField>
        </div>
      </Fieldset>

      <Fieldset number="02" title="How you play" description="Choose up to six sports and tell us your level in each.">
        <Controller
          control={control}
          name="sports"
          render={({ field }) => (
            <SportPicker
              sports={sports}
              value={field.value}
              onChange={field.onChange}
              errors={Object.fromEntries(
                (errors.sports && Array.isArray(errors.sports) ? errors.sports : []).flatMap((e, i) =>
                  e?.level?.message ? [[`sports.${i}.level`, e.level.message]] : [],
                ),
              )}
            />
          )}
        />
        {errors.sports?.message || errors.sports?.root?.message ? (
          <p role="alert" className="mt-3 text-xs text-destructive">
            {errors.sports?.message ?? errors.sports?.root?.message}
          </p>
        ) : null}
      </Fieldset>

      <Fieldset number="03" title="When you're usually free" description="A general weekly picture is enough — you can change it later.">
        <Controller
          control={control}
          name="availability"
          render={({ field }) => (
            <AvailabilityGrid value={field.value} onChange={field.onChange} invalid={!!err("availability")} describedBy="availability-error" />
          )}
        />
        {err("availability") ? (
          <p id="availability-error" role="alert" className="mt-3 text-xs text-destructive">
            {err("availability")}
          </p>
        ) : null}
      </Fieldset>

      <Fieldset number="04" title="In your words">
        <div className="flex flex-col gap-8">
          <FormField id="introduction" label="A short introduction" required error={err("introduction")} hint={`${introLength}/1200 · Who you are, where you're from, how sport fits into your life.`}>
            <Textarea id="introduction" rows={5} aria-invalid={!!err("introduction")} {...register("introduction")} />
          </FormField>
          <FormField id="motivation" label="Why would you like to join?" required error={err("motivation")} hint={`${motivationLength}/1200`}>
            <Textarea id="motivation" rows={4} aria-invalid={!!err("motivation")} {...register("motivation")} />
          </FormField>
        </div>
      </Fieldset>

      <Fieldset number="05" title="Finishing touches">
        <div className="grid gap-8 sm:grid-cols-2">
          <FormField id="photo" label="Profile photograph" error={photoError ?? undefined} hint="Optional. JPEG, PNG or WebP, up to 4 MB. Seen only by our team.">
            <Input
              id="photo"
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="h-auto py-2"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setPhotoError(null);
                if (file && file.size > MAX_IMAGE_BYTES) setPhotoError("Photos must be 4 MB or smaller.");
                else if (file && !(IMAGE_TYPES as readonly string[]).includes(file.type)) setPhotoError("Please choose a JPEG, PNG or WebP image.");
                setPhoto(file);
              }}
            />
          </FormField>
          <FormField id="referralCode" label="Referral code" error={err("referralCode")} hint="Optional — if a member or our team gave you one.">
            <Input id="referralCode" autoComplete="off" className="uppercase" {...register("referralCode")} />
          </FormField>
        </div>
        <Controller
          control={control}
          name="agreeToTerms"
          render={({ field }) => (
            <div className="mt-10 flex items-start gap-3">
              <Checkbox id="agreeToTerms" checked={field.value === true} onCheckedChange={(c) => field.onChange(c === true)} aria-invalid={!!err("agreeToTerms")} />
              <label htmlFor="agreeToTerms" className="text-sm leading-relaxed text-graphite">
                I confirm I am at least 18, that the information above is accurate, and I agree to the{" "}
                <Link href="/terms" className="underline underline-offset-4" target="_blank">
                  terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-4" target="_blank">
                  privacy policy
                </Link>
                .
              </label>
            </div>
          )}
        />
        {err("agreeToTerms") ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {err("agreeToTerms")}
          </p>
        ) : null}
      </Fieldset>

      <div className="flex flex-col gap-4 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm text-muted-foreground">
          There&apos;s no charge to apply. If approved, membership is $60 per month.
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Submitting…" : "Submit application"}
        </Button>
      </div>
    </form>
  );
}

function Fieldset({ number, title, description, children }: { number: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-8 border-t border-border pt-10 lg:grid-cols-[16rem_1fr]">
      <legend className="contents">
        <span className="flex flex-col gap-2">
          <span className="font-serif text-lg text-gold">{number}</span>
          <span className="font-serif text-3xl">{title}</span>
          {description ? <span className="text-sm text-muted-foreground">{description}</span> : null}
        </span>
      </legend>
      <div>{children}</div>
    </fieldset>
  );
}
