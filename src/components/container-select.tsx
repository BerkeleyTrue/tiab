import { useState, useRef, useCallback } from "react";
import { api } from "@/trpc/react";
import { Input } from "@/components/ui/input";
import { FolderIcon, CheckIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  type Control,
  type FieldValues,
  type UseFormGetValues,
  type UseFormSetValue,
  type UseFormWatch,
  type Path,
  type PathValue,
} from "react-hook-form";

type ContainerFieldValues = FieldValues & {
  container: string;
};

interface ContainerSelectProps<TFieldValues extends ContainerFieldValues> {
  control: Control<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  description?: string;
  onTabPress?: () => void;
  label?: string;
}

export function ContainerSelect<TFieldValues extends ContainerFieldValues>({
  control,
  watch,
  setValue,
  getValues,
  onTabPress,
}: ContainerSelectProps<TFieldValues>) {
  const [openPopover, setOpenPopover] = useState(false);
  const containerInputRef = useRef<HTMLInputElement>(null);
  const name = "container" as Path<TFieldValues>;

  const containerValue: string = watch(name);

  const { data: containers, isLoading } =
    api.containers.searchContainer.useQuery(
      {
        query: containerValue,
      },
      {
        enabled: containerValue?.length > 0,
      },
    );

  const handleCommandSelect = useCallback(
    (value: string) => {
      const curr: string = getValues(name);
      // we are in the root container
      if (curr === "/") {
        setValue(
          name,
          `/${value}/` as PathValue<TFieldValues, Path<TFieldValues>>,
        );
        return;
      }

      // if no current search, add new segment
      if (curr.endsWith("/")) {
        setValue(
          name,
          `${curr}${value}/` as PathValue<TFieldValues, Path<TFieldValues>>,
        );
        return;
      }

      // we have a search query, remove and add new segment
      const segments = curr.split("/").filter(Boolean);
      segments.pop();
      if (segments.length === 0) {
        setValue(
          name,
          `/${value}/` as PathValue<TFieldValues, Path<TFieldValues>>,
        );
        return;
      }

      setValue(
        name,
        `/${segments.join("/")}/${value}/` as PathValue<
          TFieldValues,
          Path<TFieldValues>
        >,
      );
      return;
    },
    [getValues, name, setValue],
  );

  const handleCommandValueChange = useCallback(
    (value: string) => {
      const curr: string = getValues(name);
      // we are at the root container
      if (curr === "/") {
        setValue(
          name,
          `/${value}` as PathValue<TFieldValues, Path<TFieldValues>>,
        );
        return;
      }

      if (curr.endsWith("/")) {
        // starting new search
        setValue(
          name,
          `${curr}${value}` as PathValue<TFieldValues, Path<TFieldValues>>,
        );
        return;
      }

      // remove partial search, add new search
      const segments = curr.split("/").filter(Boolean);
      segments.pop();
      if (segments.length === 0) {
        setValue(
          name,
          `/${value}` as PathValue<TFieldValues, Path<TFieldValues>>,
        );
        return;
      }

      setValue(
        name,
        `/${segments.join("/")}/${value}` as PathValue<
          TFieldValues,
          Path<TFieldValues>
        >,
      );
      return;
    },
    [getValues, name, setValue],
  );

  const handleCommandKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // if we have no search query and we press backspace, we want to go up a level
      if (e.key === "Backspace" && e.currentTarget.value.length === 0) {
        const curr: string = getValues(name);
        const segments = curr.trim().split("/").filter(Boolean);
        segments.pop();

        if (segments.length === 0) {
          setValue(name, "/" as PathValue<TFieldValues, Path<TFieldValues>>);
          return;
        }

        setValue(
          name,
          `/${segments.join("/")}/` as PathValue<
            TFieldValues,
            Path<TFieldValues>
          >,
        );
        return;
      } else if (e.key === "Tab" && onTabPress) {
        setOpenPopover(false);
        e.preventDefault();
        onTabPress();
      }
    },
    [getValues, name, onTabPress, setValue],
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Container</FormLabel>
          <Popover open={openPopover} onOpenChange={setOpenPopover}>
            <PopoverTrigger asChild>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    onChange={(e) => {
                      e.preventDefault();
                    }}
                    onClick={(e) => e.preventDefault()}
                    onFocus={() => {
                      setOpenPopover(true);
                      containerInputRef.current?.focus();
                    }}
                    placeholder="/storage/location"
                    className="w-full"
                  />
                </div>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput
                  ref={containerInputRef}
                  placeholder="Search containers..."
                  value={(field.value as string).split("/").pop() ?? ""}
                  onValueChange={handleCommandValueChange}
                  onKeyDown={handleCommandKeyDown}
                />
                <CommandList>
                  <CommandEmpty>No containers found.</CommandEmpty>
                  <CommandGroup heading="Containers">
                    {containers?.length ? (
                      containers.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.path}
                          onSelect={handleCommandSelect}
                          className="flex items-center gap-2"
                        >
                          <FolderIcon className="h-4 w-4" />
                          <span>{item.path}</span>
                          {field.value === item.path && (
                            <CheckIcon className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                      ))
                    ) : (
                      <CommandItem disabled>
                        {isLoading ? "Loading..." : "Type to search"}
                      </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormDescription>Set the items container</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
