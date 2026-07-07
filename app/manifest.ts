import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CoinPulse Chart Dashboard",
    short_name: "CoinPulse",
    description:
      "Interactive cryptocurrency dashboard with native HTML5 Canvas charts",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#3b82f6",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "screenshots/descktop-home.webp",
        sizes: "1920x1080",
        form_factor: "wide",
        label: "Desktop view showing Coin Pulse App",
      },
      {
        src: "screenshots/mobile-home.webp",
        sizes: "400x800",
        form_factor: "narrow",
        label: "Mobile view showing Coin Pulse App",
      },
    ],
  };
}
