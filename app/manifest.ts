import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Spelling Rumble", short_name: "Spelling Rumble", description: "Listen, type, and improve your spelling skills.", start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#6b1036" };
}
