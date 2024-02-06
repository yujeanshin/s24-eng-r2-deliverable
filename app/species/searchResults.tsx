"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState, type FormEvent } from "react";

// id (integer)
// title (string)
// description (string)
// thumbnail.url (string)

// show top 3 titles -> pick?

// /search/page?q=search terms
// GET
// application/json
// return pages object containing array of search results

// type Species = Database["public"]["Tables"]["species"]["Row"];

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
// interface SearchOverall {
//   pages: SearchResult[];
// }

// export default function SearchResults({ q }: { q: string }) {
export default function SearchResults() {
  const [loadingState, setLoadingState] = useState<"Loading" | "Resolved" | "Error" | "Not Started">("Not Started");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchInput, setSearchInput] = useState("");

  // const [showResults, setShowResults] = useState(false);
  const search = (e: FormEvent) => {
    e.preventDefault();
    setLoadingState("Loading");
  };

  const url = "https://en.wikipedia.org/w/rest.php/v1/search/page";
  const query = url + "?q=" + searchInput.trim() + "&limit=" + num_results;

  useEffect(() => {
    const fetchResults = () => [
      fetch(query)
        .then((response) => {
          if (!response.ok) {
            setLoadingState("Error");
            toast({
              title: "Something went wrong.",
              description: "No results found.",
              variant: "destructive",
            });
          }
          return response.json();
        })
        .then((data) => {
          setResults(data?.pages);
          setLoadingState("Resolved");
          console.log(results);
          if (results.length === 0) {
            toast({
              title: "No results found.",
              description: "No results for " + searchInput.trim() + ".",
              variant: "destructive",
            });
          }
        })
        .catch((err) => {
          setLoadingState("Error");
          toast({
            title: "Something went wrong.",
            description: "" + err,
            variant: "destructive",
          });
        }),
    ];
    console.log(results);
    if (loadingState === "Loading") {
      fetchResults();
    }
  }, [loadingState]);

  return (
    <form className="flex w-full max-w-sm items-center space-x-0" onSubmit={search}>
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
        <div className="mx-2 w-max space-y-2">
          {results?.map((result: SearchResult) => <div key={result.id}>{result.title}</div>)}
        </div>
      ) : (
        loadingState === "Loading" && <div className="mx-2 w-max space-y-2">Loading results...</div>
      )}
    </form>
  );
}
