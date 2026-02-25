import { useEffect } from "react";

type SeoProps = {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
};

function upsertMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertPropertyMeta(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function Seo({ title, description, canonical, noindex }: SeoProps) {
  useEffect(() => {
    document.title = title;

    if (description) upsertMeta("description", description);

    if (canonical) upsertLink("canonical", canonical);

    if (noindex) {
      upsertMeta("robots", "noindex,nofollow");
    } else {
      const robots = document.querySelector(`meta[name="robots"]`);
      if (robots) robots.remove();
    }

    // Open Graph básico
    upsertPropertyMeta("og:title", title);
    if (description) upsertPropertyMeta("og:description", description);
    if (canonical) upsertPropertyMeta("og:url", canonical);
    upsertPropertyMeta("og:type", "website");
  }, [title, description, canonical, noindex]);

  return null;
}