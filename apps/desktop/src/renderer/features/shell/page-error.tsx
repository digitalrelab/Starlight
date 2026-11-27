import { Link } from "@tanstack/react-router";
import { PageHeader } from "./page-header.tsx";

export const PageError = ({ error }: { readonly error: unknown }) => (
  <>
    <PageHeader />
    <div className="flex flex-1 flex-col items-center justify-center gap-2">
      <p className="max-w-md text-center text-subtle">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <Link to="/" className="text-link hover:underline">
        Back
      </Link>
    </div>
  </>
);
