/** Site-relative path of a book page's share card (GEMINI.md section 27), shared by the renderer and inject-gating. */
export function ogImagePath(slug: string, page: string): string {
  return `/og/${slug}/${page}.png`;
}
