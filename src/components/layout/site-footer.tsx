export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Familying. All rights reserved.
      </div>
    </footer>
  );
}
