import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Suspense, useEffect, useState } from "react";

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

const search = () => {
  null;
};

// export default function SearchResults({ q }: { q: string }) {
export default function SearchResults() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchInput, setSearchInput] = useState("");

  const url = "https://en.wikipedia.org/w/rest.php/v1/search/page";
  const query = url + "?q=" + searchInput.trim() + "&limit=" + num_results;

  useEffect(() => {
    const fetchResults = () => [
      fetch(query)
        .then((response) => response.json())
        .then((data) => setResults(data?.pages)),
    ];
    fetchResults();
  });

  // try {
  //   const response = await fetch(query);
  //   const data = await response.json();
  //   setResults(data?.pages);
  // } catch (error) {
  //     console.log(error);
  // }

  // const fetchResults = async () => {
  //   const response = await fetch(query);
  //   if (!response.ok) {
  //     throw Error(response.statusText);
  //   }
  //   const data = await response.json();
  //   setResults(data?.pages);
  // };

  // useEffect(() => {
  //   fetchResults();
  //   console.log(results);
  // }, []);

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input
        type="text"
        placeholder="Search species to autofill"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
      />
      <Button type="button" onClick={search}>
        Search
      </Button>
      <Suspense fallback={"Loading search results..."}>
        <div className="results-container">
          {results?.map((result: SearchResult) => <div key={result.id}>{result.title}</div>)}
        </div>
      </Suspense>
    </div>
  );
}
