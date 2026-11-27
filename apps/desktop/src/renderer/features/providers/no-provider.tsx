import { Link } from "@tanstack/react-router";

export const NoProvider = () => (
  <p className="rounded-xl border border-default px-4 py-3 text-subtle">
    No model is available. Set up a provider in{" "}
    <Link to="/settings/providers" className="text-link hover:underline">
      Settings › Providers
    </Link>
    .
  </p>
);
