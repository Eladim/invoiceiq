export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        Coming soon
      </div>
    </div>
  );
}
