/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6ffea",
          100: "#b3ffc7",
          200: "#80ffa4",
          300: "#4dff80",
          400: "#1aff5c",
          500: "#00e639",
          600: "#00b32d",
          700: "#008022",
          800: "#004d14",
          900: "#001a07",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        cyber: {
          black: "#050505",
          darkgray: "#101010",
          midgray: "#1a1a1a",
          terminal: "#0C0C0C",
        },
        accent: {
          blue: "#00f6ff",
          cyan: "#0affff",
          magenta: "#ff00ff",
          purple: "#bf00ff",
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        cyber: ["Orbitron", "sans-serif"],
        orbitron: ["Orbitron", "sans-serif"],
        terminal: ["Share Tech Mono", "monospace"],
        body: ["Space Mono", "monospace"],
        "space-mono": ["Space Mono", "monospace"],
      },
      boxShadow: {
        neon: "0 0 5px #00e639, 0 0 20px #00e639",
        "neon-strong": "0 0 10px #00e639, 0 0 30px #00e639",
        "neon-blue": "0 0 5px #00f6ff, 0 0 20px #00f6ff",
        "neon-magenta": "0 0 5px #ff00ff, 0 0 20px #ff00ff",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        glitch: "glitch 1s linear infinite",
        "terminal-cursor": "blink 1s step-end infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        slideUp: {
          "0%": {
            transform: "translateY(10px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        glitch: {
          "0%, 100%": {
            transform: "translate(0)",
          },
          "20%": {
            transform: "translate(-2px, 2px)",
          },
          "40%": {
            transform: "translate(-2px, -2px)",
          },
          "60%": {
            transform: "translate(2px, 2px)",
          },
          "80%": {
            transform: "translate(2px, -2px)",
          },
        },
        blink: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-shadow-neon-green": {
          textShadow: "0 0 5px #00e639, 0 0 10px #00e639",
        },
        ".text-shadow-neon-blue": {
          textShadow: "0 0 5px #00f6ff, 0 0 10px #00f6ff",
        },
        ".text-shadow-neon-magenta": {
          textShadow: "0 0 5px #ff00ff, 0 0 10px #ff00ff",
        },
        ".bg-terminal-pattern": {
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><text x="50%" y="50%" font-family="monospace" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="%2300e639">01</text></svg>')`,
          backgroundSize: "50px 50px",
        },
      };
      addUtilities(newUtilities);
    },
    require("tailwindcss-animate"),
  ],
};
