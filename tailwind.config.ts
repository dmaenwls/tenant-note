import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Custom colors from legacy theme.css
        primary: "#3b82f6",
        "text-main": "#1f2937",
        "bg-sidebar": "#ffffff",
        "border-basic": "#e5e7eb",
        "safe-green": "#22c55e",
        "warning-yellow": "#eab308",
        "danger-red": "#ef4444",
      },
    },
  },
  plugins: [],
};
export default config;
