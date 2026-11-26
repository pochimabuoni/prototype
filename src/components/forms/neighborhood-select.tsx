import { NativeSelect } from "@/components/ui/native-select";
import { neighborhoodsByBorough, type Neighborhood } from "@/lib/domain/neighborhoods";

export function NeighborhoodSelect(
  props: React.ComponentProps<typeof NativeSelect> & { placeholder?: string; options?: readonly Neighborhood[] },
) {
  const { placeholder = "Select your neighbourhood…", options, ...rest } = props;
  return (
    <NativeSelect {...rest}>
      <option value="">{placeholder}</option>
      {neighborhoodsByBorough(options).map(([borough, list]) => (
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
