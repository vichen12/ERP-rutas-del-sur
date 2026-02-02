import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // 👈 ¡ESTO ES VITAL! Sin esto, dark:bg-... no funciona.
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
};
export default config;