import { serializeLd } from '@/lib/jsonld';

/** Renders schema.org JSON-LD. Native <script> (not next/script), "<"-escaped per the Next.js guide. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(data) }} />;
}
