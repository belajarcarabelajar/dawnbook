export const onRequest: PagesFunction = async (context) => {
  // First, try to serve the static asset
  const response = await context.env.ASSETS.fetch(context.request);
  
  // If the asset is found, return it (e.g. JS, CSS, images)
  if (response.status !== 404) {
    return response;
  }

  // If the asset is not found (404), fallback to serving the SPA's index.html
  // This enables React Router to handle client-side routing for /admin/*
  const url = new URL(context.request.url);
  url.pathname = "/admin/index.html";
  
  return context.env.ASSETS.fetch(url);
};
