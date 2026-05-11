type MetaTagOptions = {
  title: string
  description: string
  url: string
  imageUrl?: string
}

function getBaseUrl(): string {
  if (import.meta.env.VITE_APP_BASE_URL) {
    return import.meta.env.VITE_APP_BASE_URL
  }

  return typeof window !== 'undefined' ? window.location.origin : ''
}

export function setPageMetaTags(options: MetaTagOptions): void {
  const ogImage = options.imageUrl ?? `${getBaseUrl()}/og-image.png`

  document.title = options.title

  setOrCreateMeta('og:title', options.title, 'property')
  setOrCreateMeta('og:description', options.description, 'property')
  setOrCreateMeta('og:url', options.url, 'property')
  setOrCreateMeta('og:image', ogImage, 'property')
  setOrCreateMeta('og:type', 'website', 'property')
  setOrCreateMeta('twitter:card', 'summary_large_image', 'name')
  setOrCreateMeta('twitter:title', options.title, 'name')
  setOrCreateMeta('twitter:description', options.description, 'name')
  setOrCreateMeta('twitter:image', ogImage, 'name')
}

function setOrCreateMeta(key: string, content: string, attrType: 'property' | 'name'): void {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attrType}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attrType, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}