import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { type Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Suspense, useState, type BaseSyntheticEvent, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AuthorsList from "./author";
import SearchResults from "./searchResults";

type Species = Database["public"]["Tables"]["species"]["Row"];

// We use zod (z) to define a schema for the "Add species" form.
// zod handles validation of the input values with methods like .string(), .nullable(). It also processes the form inputs with .transform() before the inputs are sent to the database.

// Define kingdom enum for use in Zod schema and displaying dropdown options in the form
const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

// Use Zod to define the shape + requirements of a Species entry; used in form validation
const speciesSchema = z.object({
  scientific_name: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val?.trim()),
  common_name: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  kingdom: kingdoms,
  endangered: z.boolean().nullable().optional(),
  total_population: z.number().int().positive().min(1).nullable(),
  image: z
    .string()
    .url()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  description: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
});

type FormData = z.infer<typeof speciesSchema>;

export default function SpeciesDetailsDialog({ species, currentUser }: { species: Species; currentUser: string }) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  // Default values for the form fields.
  const defaultValues: Partial<FormData> = {
    scientific_name: species.scientific_name,
    common_name: species.common_name,
    kingdom: species.kingdom,
    endangered: species.endangered,
    total_population: species.total_population,
    image: species.image,
    description: species.description,
  };

  // Instantiate form functionality with React Hook Form, passing in the Zod schema (for validation) and default values
  const form = useForm<FormData>({
    resolver: zodResolver(speciesSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (input: FormData) => {
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.from("species").update(input).eq("id", species.id);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsEditing(false);

    form.reset(input);

    router.refresh();

    return toast({
      title: "Changes saved!",
      description: "Saved your changes to " + input.scientific_name + ".",
    });
  };

  const startEditing = (e: MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
  };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    // OK: true --> continue. Cancel: false --> exit function early
    if (!window.confirm("Revert all unsaved changes?")) {
      return;
    }

    form.reset(defaultValues);
    setIsEditing(false);
  };

  const handleDelete = (e: MouseEvent) => {
    e.preventDefault();
    // OK: true --> continue. Cancel: false --> exit function early
    if (!window.confirm("Delete the " + species.scientific_name + " species?")) {
      return;
    }

    onDelete().then(onDeleteConfirm, onDeleteError);
  };

  const onDeleteError = () => {
    return toast({
      title: "Something went wrong.",
      variant: "destructive",
    });
  };
  const onDeleteConfirm = () => {
    return toast({
      title: "Species deleted.",
      description: "Deleted the " + species.scientific_name + " species.",
    });
  };
  const onDelete = async () => {
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.from("species").delete().eq("id", species.id);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    router.refresh();

    return toast({
      title: "Species deleted.",
      description: "Deleted the " + species.scientific_name + " species.",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-3 w-full">Learn More</Button>
      </DialogTrigger>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{species.scientific_name}</DialogTitle>
          {species.common_name && <DialogDescription>{species.common_name}</DialogDescription>}
          {/* added author's name */}
          <DialogDescription>
            Author:{" "}
            <Suspense fallback={"Loading..."}>
              <AuthorsList species_author={species.author} />
            </Suspense>
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <SearchResults />

        <Form {...form}>
          <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
            <div className="grid w-full items-center gap-4">
              <FormField
                control={form.control}
                name="scientific_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scientific Name</FormLabel>
                    <FormControl>
                      <Input readOnly={!isEditing} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="common_name"
                render={({ field }) => {
                  // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Common Name</FormLabel>
                      <FormControl>
                        <Input readOnly={!isEditing} value={value ?? ""} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="kingdom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kingdom</FormLabel>
                    <Select
                      disabled={!isEditing}
                      onValueChange={(value) => field.onChange(kingdoms.parse(value))}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a kingdom" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {kingdoms.options.map((kingdom, index) => (
                            <SelectItem key={index} value={kingdom}>
                              {kingdom}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* new endangered field */}
              <FormField
                control={form.control}
                name="endangered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endangered?</FormLabel>
                    <Select
                      disabled={!isEditing}
                      onValueChange={(value) => field.onChange(value === "T" ? true : value === "F" ? false : null)}
                      value={field.value ? "T" : field.value === false ? "F" : "D"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select endangered status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem key={2} value={"D"}>
                            Select Option
                          </SelectItem>
                          <SelectItem key={1} value={"T"}>
                            True
                          </SelectItem>
                          <SelectItem key={0} value={"F"}>
                            False
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_population"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Total population</FormLabel>
                      <FormControl>
                        {/* Using shadcn/ui form with number: https://github.com/shadcn-ui/ui/issues/421 */}
                        <Input
                          readOnly={!isEditing}
                          type="number"
                          value={value ?? ""}
                          {...rest}
                          onChange={(event) => field.onChange(+event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => {
                  // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input readOnly={!isEditing} value={value ?? ""} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => {
                  // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea readOnly={!isEditing} value={value ?? ""} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              {species.author === currentUser && (
                <div className="flex">
                  {isEditing ? (
                    // viewing mode
                    <>
                      <Button type="submit" className="ml-1 mr-1 flex-auto">
                        Confirm
                      </Button>
                      <Button onClick={handleCancel} type="button" className="ml-1 mr-1 flex-auto" variant="secondary">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    // editing mode
                    <>
                      <Button onClick={startEditing} type="button" className="ml-1 mr-1 flex-auto">
                        Edit Species
                      </Button>
                      {/* added delete button */}
                      <Button
                        onClick={handleDelete}
                        type="button"
                        className="ml-1 mr-1 flex-auto bg-red-700 hover:bg-red-500"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
