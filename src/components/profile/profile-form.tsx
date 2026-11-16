"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { profileSchema, type ProfileData, type ProfileInput } from "@/lib/validation/profile";
import { saveProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { NativeSelect } from "@/components/ui/native-select";
import { AvailabilityGrid } from "@/components/forms/availability-grid";
import { SportPicker, type SportOption } from "@/components/forms/sport-picker";
import { NeighborhoodSelect } from "@/components/forms/neighborhood-select";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/validation/common";

export function ProfileForm({
  sports,
  initial,
  photoUrl,
  submitLabel = "Save profile",
  redirectTo,
}: {
  sports: SportOption[];
  initial: ProfileInput;
  photoUrl?: string | null;
  submitLabel?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(photoUrl ?? null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const { register, control, handleSubmit, formState, setError } = useForm<ProfileInput, unknown, ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initial,
    mode: "onBlur",
  });
  const errors = formState.errors;

  const onSubmit = (data: ProfileData) => {
    if (photoError) return;
    setServerError(null);
    const fd = new FormData();
    fd.set("payload", JSON.stringify(data));
    if (photo) fd.set("photo", photo);
    startTransition(async () => {
      const result = await saveProfile(fd);
      if (!result.ok) {
        setServerError(result.error);
        for (const [k, v] of Object.entries(result.fieldErrors ?? {})) {
          if (k === "photo") setPhotoError(v);
          else setError(k as keyof ProfileInput, { message: v });
        }
        return;
      }
      toast.success("Profile saved");
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  };

  const [firstName, lastName] = useWatch({ control, name: ["firstName", "lastName"] });
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Member";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-14">
      {serverError ? <Alert variant="destructive">{serverError}</Alert> : null}

      <Section title="Portrait & name">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-6">
            <Avatar src={preview} name={name} size={88} />
            <div className="flex flex-col gap-2">
              <label htmlFor="photo" className="cursor-pointer text-xs uppercase tracking-[0.16em] underline underline-offset-4">
                {preview ? "Change photograph" : "Add a photograph"}
              </label>
              <input
                id="photo"
                type="file"
                accept={IMAGE_TYPES.join(",")}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPhotoError(null);
                  if (!file) return;
                  if (file.size > MAX_IMAGE_BYTES) return setPhotoError("Photos must be 4 MB or smaller.");
                  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return setPhotoError("Please choose a JPEG, PNG or WebP image.");
                  setPhoto(file);
                  setPreview(URL.createObjectURL(file));
                }}
              />
              <p className="text-xs text-muted-foreground">A clear, recent photo. Visible to members only.</p>
              {photoError ? <p role="alert" className="text-xs text-destructive">{photoError}</p> : null}
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <FormField id="firstName" label="First name" required error={errors.firstName?.message}>
              <Input id="firstName" autoComplete="given-name" {...register("firstName")} />
            </FormField>
            <FormField id="lastName" label="Surname" error={errors.lastName?.message}>
              <Input id="lastName" autoComplete="family-name" {...register("lastName")} />
            </FormField>
          </div>
          <Controller
            control={control}
            name="showLastName"
            render={({ field }) => (
              <label className="flex items-center gap-3 text-sm">
                <Checkbox checked={!!field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                Show my full surname to members (otherwise only an initial is shown)
              </label>
            )}
          />
        </div>
      </Section>

      <Section title="About">
        <div className="grid gap-8 sm:grid-cols-2">
          <FormField id="bio" label="Short biography" error={errors.bio?.message} className="sm:col-span-2" hint="Up to 600 characters.">
            <Textarea id="bio" rows={4} {...register("bio")} />
          </FormField>
          <FormField id="neighborhood" label="Neighbourhood" required error={errors.neighborhood?.message} hint="Only your neighbourhood is ever shown.">
            <NeighborhoodSelect id="neighborhood" {...register("neighborhood")} />
          </FormField>
          <FormField id="occupation" label="Profession or university" error={errors.occupation?.message}>
            <Input id="occupation" {...register("occupation")} />
          </FormField>
          <Controller
            control={control}
            name="showOccupation"
            render={({ field }) => (
              <label className="flex items-center gap-3 text-sm sm:col-span-2">
                <Checkbox checked={!!field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                Show my profession or university on my profile
              </label>
            )}
          />
        </div>
      </Section>

      <Section title="Sports, levels & formats">
        <Controller
          control={control}
          name="sports"
          render={({ field }) => (
            <SportPicker
              sports={sports}
              value={field.value.map((s) => ({ ...s, formats: s.formats ?? [] }))}
              onChange={field.onChange}
              withFormats
              max={8}
              errors={Object.fromEntries(
                (Array.isArray(errors.sports) ? errors.sports : []).flatMap((e, i) =>
                  e?.level?.message ? [[`sports.${i}.level`, e.level.message]] : [],
                ),
              )}
            />
          )}
        />
        {errors.sports?.message || errors.sports?.root?.message ? (
          <p role="alert" className="mt-3 text-xs text-destructive">{errors.sports?.message ?? errors.sports?.root?.message}</p>
        ) : null}
      </Section>

      <Section title="Availability">
        <Controller
          control={control}
          name="availability"
          render={({ field }) => <AvailabilityGrid value={field.value} onChange={field.onChange} invalid={!!errors.availability} />}
        />
        {errors.availability?.message ? <p role="alert" className="mt-3 text-xs text-destructive">{errors.availability.message}</p> : null}
      </Section>

      <Section title="Visibility">
        <FormField id="visibility" label="Who can see your profile" hint="Hidden profiles don't appear in discovery; existing connections and conversations remain.">
          <NativeSelect id="visibility" {...register("visibility")}>
            <option value="MEMBERS">All active members</option>
            <option value="CONNECTIONS">Only my connections</option>
            <option value="HIDDEN">Hidden</option>
          </NativeSelect>
        </FormField>
      </Section>

      <div className="flex justify-end border-t border-border pt-8">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-border pt-8 lg:grid-cols-[14rem_1fr]">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
