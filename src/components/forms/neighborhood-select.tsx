import { NativeSelect } from "@/components/ui/native-select";
import { neighborhoodsByBorough } from "@/lib/domain/neighborhoods";

export function NeighborhoodSelect(props: React.ComponentProps<typeof NativeSelect> & { placeholder?: string }) {
  const { placeholder = "Select your neighbourhood…", ...rest } = props;
  return (
    <NativeSelect {...rest}>
      <option value="">{placeholder}</option>
      {neighborhoodsByBorough().map(([borough, list]) => (
        <optgroup key={borough} label={borough}>
          {list.map((n) => (
            <option key={n.slug} value={n.slug}>
              {n.name}
            </option>
          ))}
        </optgroup>
      ))}
    </NativeSelect>
  );
}
