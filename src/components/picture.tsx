import { type ImageEntry, type ImageId, images } from '@/lib/content'
import { withBase } from '@/lib/site'

/*
 * <Picture id sizes priority?>: one image from content/images.ts.
 *   local   <picture> with AVIF / WebP <source>s (when listed) and a JPEG <img>,
 *           files at public/images/<id>-<width>.<ext>, URLs through withBase()
 *   remote  a hotlinked srcset (the source URL's {w} replaced per width)
 * priority: loading="eager" + fetchpriority="high" (the one hero image above
 * the fold); otherwise lazy. width/height come from the entry, so the box is
 * reserved before the image loads. Owned by the Content & Images session.
 * Contract: docs/contracts.md#picture.
 */
type Props = {
  id: ImageId
  /** The sizes attribute, e.g. "100vw" or "(min-width: 1024px) 66vw, 100vw". */
  sizes: string
  priority?: boolean
  className?: string
  /** Overrides the entry's alt (rarely: the same image in two roles). */
  alt?: string
}

const ext = { avif: 'avif', webp: 'webp', jpeg: 'jpg' } as const
const mime = { avif: 'image/avif', webp: 'image/webp', jpeg: 'image/jpeg' } as const

export function getImage(id: ImageId): ImageEntry {
  const entry: ImageEntry | undefined = images[id]
  if (!entry) throw new Error(`content/images.ts has no image "${id}".`)
  return entry
}

export function Picture({ id, sizes, priority = false, className, alt }: Props) {
  const image = getImage(id)
  const imgProps = {
    alt: alt ?? image.alt,
    width: image.width,
    height: image.height,
    sizes,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    fetchPriority: priority ? ('high' as const) : undefined,
    decoding: 'async' as const,
    style: image.placeholder ? { backgroundColor: image.placeholder } : undefined,
  }

  if (image.local) {
    const { widths, formats } = image.local
    const largest = Math.max(...widths)
    const url = (w: number, format: keyof typeof ext) => withBase(`/images/${id}-${w}.${ext[format]}`)
    const srcSet = (format: keyof typeof ext) => widths.map((w) => `${url(w, format)} ${w}w`).join(', ')
    return (
      <picture className={className} data-image={id}>
        {formats.includes('avif') && <source type={mime.avif} srcSet={srcSet('avif')} sizes={sizes} />}
        {formats.includes('webp') && <source type={mime.webp} srcSet={srcSet('webp')} sizes={sizes} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url(largest, 'jpeg')} srcSet={srcSet('jpeg')} {...imgProps} />
      </picture>
    )
  }

  if (image.remote) {
    const { src, widths } = image.remote
    const at = (w: number) => src.replace('{w}', String(w))
    return (
      <picture className={className} data-image={id}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={at(Math.max(...widths))} srcSet={widths.map((w) => `${at(w)} ${w}w`).join(', ')} {...imgProps} />
      </picture>
    )
  }

  throw new Error(`content/images.ts: "${id}" needs local or remote sources.`)
}
