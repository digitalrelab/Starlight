export const DialogSubject = ({ children }: { readonly children: string }) => (
  <div className="flex px-dialog pt-4">
    <span className="inline-flex h-6 max-w-full items-center truncate rounded-full bg-neutral px-2 text-sm text-default">
      {children}
    </span>
  </div>
);
