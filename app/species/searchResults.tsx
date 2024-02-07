// used Wikipedia REST API found at https://www.mediawiki.org/wiki/API:REST_API/Reference

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState, type Dispatch, type FormEvent, type MouseEvent, type SetStateAction } from "react";
import { type SearchVal } from "./add-species-dialog";

const num_results = 3;

interface Thumbnail {
  mimetype: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  url: string;
}
interface SearchResult {
  id: number;
  title: string;
  excerpt: string;
  matched_title: string | null;
  description: string;
  thumbnail: Thumbnail | null;
}

export default function SearchResults({
  setSearchSelect,
}: {
  setSearchSelect: Dispatch<SetStateAction<SearchVal | null>>;
}) {
  // used to control when search results are displayed
  const [loadingState, setLoadingState] = useState<"Loading" | "Resolved" | "Error" | "Not Started">("Not Started");

  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchInput, setSearchInput] = useState("");

  // runs when search is submitted
  const search = (e: FormEvent) => {
    e.preventDefault();
    setLoadingState("Loading");
  };

  const url = "https://en.wikipedia.org/w/rest.php/v1/search/page";
  const query = url + "?q=" + searchInput.trim() + "&limit=" + num_results;

  useEffect(() => {
    const fetchResults = () => {
      fetch(query)
        .then(async (response) => {
          if (!response.ok) {
            setLoadingState("Error");
            toast({
              title: "Something went wrong.",
              description: "No results found.",
              variant: "destructive",
            });
          }
          const data = await response.json();
          return data;
        })
        .then((data: { pages: SearchResult[] } | undefined) => {
          if (data?.pages && Array.isArray(data.pages)) {
            setResults(data.pages);
            setLoadingState("Resolved");
          } else {
            throw new Error("Invalid data format");
          }
        })
        .catch((err) => {
          setLoadingState("Error");
          toast({
            title: "No results found.",
            description: "" + err,
            variant: "destructive",
          });
        });
    };
    if (loadingState === "Loading") {
      fetchResults();
    } else if (loadingState === "Resolved") {
      if (results === null || results === undefined || results.length === 0) {
        toast({
          title: "No results found.",
          description: 'No results for "' + searchInput.trim() + '"',
          variant: "destructive",
        });
      }
    }
  }, [loadingState]); // should only depend on changes in loadingState

  const handleClick = (e: MouseEvent) => {
    const searchSelect: SearchVal = {
      description: e.currentTarget.getAttribute("description"),
      url: e.currentTarget.getAttribute("url"),
    };
    setSearchSelect(searchSelect);
  };

  return (
    <form className="flex w-full max-w-fit items-center space-x-2" onSubmit={search}>
      <Input
        type="text"
        placeholder="Search species to autofill"
        value={searchInput}
        onChange={(event) => {
          setSearchInput(event.target.value);
        }}
      />
      <Button type="submit">Search</Button>

      {loadingState === "Resolved" ? (
        <div className="mx-2 w-fit space-y-2">
          {results?.map((result: SearchResult) => (
            <Button
              type="button"
              variant="outline"
              key={result.id}
              description={result?.description}
              url={result?.thumbnail?.url}
              onClick={handleClick}
            >
              {result.title}
            </Button>
          ))}
        </div>
      ) : (
        loadingState === "Loading" && <div className="mx-2 w-max space-y-2">Loading results...</div>
      )}
    </form>
  );
}
