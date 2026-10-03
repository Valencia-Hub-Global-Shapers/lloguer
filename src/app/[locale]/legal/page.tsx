import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-4 pb-16">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">{dict.legal.title}</h1>
      <div className="grid gap-4 text-sm leading-relaxed">
        <p>{dict.legal.intro}</p>
        <section>
          <h2 className="mb-1 font-semibold">{dict.legal.dataTitle}</h2>
          <p className="text-muted-foreground">{dict.legal.dataBody}</p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold">{dict.legal.processorsTitle}</h2>
          <p className="text-muted-foreground">{dict.legal.processorsBody}</p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold">{dict.legal.contentTitle}</h2>
          <p className="text-muted-foreground">{dict.legal.contentBody}</p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold">{dict.legal.contactTitle}</h2>
          <p className="text-muted-foreground">{dict.legal.contactBody}</p>
        </section>
      </div>
    </main>
  );
}
