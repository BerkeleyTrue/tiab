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
import { useRandomNameGenerator } from "@/hooks/use-random-name";

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
  disabled?: boolean;
}

export function ContainerSelect<TFieldValues extends ContainerFieldValues>({
  control,
  watch,
  setValue,
  getValues,
  onTabPress,
  disabled,
}: ContainerSelectProps<TFieldValues>) {
  const [openPopover, setOpenPopover] = useState(false);
  const containerInputRef = useRef<HTMLInputElement>(null);
  const name = "container" as Path<TFieldValues>;

  const innerSetValue = useCallback(
    (val: string) => {
      setValue(name, val as PathValue<TFieldValues, Path<TFieldValues>>, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue],
  );

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

  const {
    randomName,
    regenerate,
    isLoading: isRandomNameLoading,
  } = useRandomNameGenerator();

  const handleCommandSelect = useCallback(
    (value: string) => {
      const curr: string = getValues(name);
      regenerate();
      // we are in the root container
      if (curr === "/") {
        innerSetValue(`/${value}/`);
        return;
      }

      // if no current search, add new segment
      if (curr.endsWith("/")) {
        innerSetValue(`${curr}${value}/`);
        return;
      }

      // we have a search query, remove and add new segment
      const segments = curr.split("/").filter(Boolean);
      segments.pop();
      if (segments.length === 0) {
        innerSetValue(`/${value}/`);
        return;
      }

      innerSetValue(`/${segments.join("/")}/${value}/`);
      return;
    },
    [getValues, name, innerSetValue, regenerate],
  );

  const handleCommandValueChange = useCallback(
    (value: string) => {
      value = value.replace(/\s+/g, "_");
      if (value === "/") {
        return;
      }

      const curr: string = getValues(name);
      // we are at the root container
      if (curr === "/") {
        innerSetValue(`/${value}`);
        return;
      }

      if (curr.endsWith("/")) {
        // starting new search
        innerSetValue(`${curr}${value}`);
        return;
      }

      // remove partial search, add new search
      const segments = curr.split("/").filter(Boolean);
      segments.pop();
      if (segments.length === 0) {
        innerSetValue(`/${value}`);
        return;
      }

      innerSetValue(`/${segments.join("/")}/${value}`);
      return;
    },
    [getValues, name, innerSetValue],
  );

  const handleCommandKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      // if we have no search query and we press backspace, we want to go up a level
      if (e.key === "Backspace" && value.length === 0) {
        regenerate();
        const curr: string = getValues(name);
        const segments = curr.trim().split("/").filter(Boolean);
        segments.pop();

        if (segments.length === 0) {
          innerSetValue("/");
          return;
        }

        innerSetValue(`/${segments.join("/")}/`);
        return;
      }

      if (e.key === "Tab" && onTabPress) {
        setOpenPopover(false);
        e.preventDefault();
        onTabPress();
        return;
      }

      if (e.key === "/" && value.length !== 0 && value !== "/") {
        regenerate();
        return;
      }
    },
    [getValues, name, onTabPress, innerSetValue, regenerate],
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Container</FormLabel>
          <Popover
            open={!disabled && openPopover}
            onOpenChange={setOpenPopover}
          >
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
                      if (disabled) {
                        return;
                      }
                      setOpenPopover(true);
                      containerInputRef.current?.focus();
                    }}
                    placeholder="/storage/location"
                    className="w-full"
                    disabled={disabled}
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
                  disabled={disabled}
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
                    {!isRandomNameLoading && (
                      <CommandItem
                        value={randomName}
                        onSelect={handleCommandSelect}
                        className="flex items-center gap-2"
                      >
                        <FolderIcon className="h-4 w-4" />
                        <span>{randomName}</span>
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
