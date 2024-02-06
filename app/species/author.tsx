import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";

export default async function AuthorsList({ species_author }: { species_author: string }): Promise<string[]> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.from("profiles").select("display_name").eq("id", species_author);

  if (error) {
    toast({
      title: "Something went wrong.",
      description: error.message,
      variant: "destructive",
    });
    return [];
  }

  const authors: string[] = [];
  for (const datum of data) {
    authors.push(datum?.display_name);
  }
  return authors;
}
