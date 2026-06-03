const domain = process.env.CONVEX_SITE_URL || "https://usable-stork-789.convex.site";

export default {
  providers: [
    {
      domain: domain,
      applicationID: "convex",
    },
  ],
};
