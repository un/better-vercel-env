import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-3 px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Vercel Better Env</h1>
      <p className="max-w-2xl text-base text-neutral-600">
        Local matrix editor for Vercel environment variables.
      </p>
      <div className="mt-4 flex max-w-xl flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <Badge className="w-fit" variant="secondary">
          Setup in progress
        </Badge>
        <Input placeholder="Paste your Vercel token in upcoming steps" readOnly />
        <Button className="w-fit" disabled>
          Continue
        </Button>
      </div>
    </main>
  );
}
