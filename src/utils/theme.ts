import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  strictTokens: true,
  globalCss: {
    "html, body": {
      margin: 0,
      padding: 0,
      backgroundColor: "bg",
    },
  },
  theme: {
    tokens: {
      colors: {
        primary: {
          value: "#20DC8E",
        },
        secondary: {
          value: "#08080A",
        },
        textPrimary: {
          value: "#FFFFFF",
        },
        textSecondary: {
          value: "#6B7280",
        },
        background: {
          value:
            "linear-gradient(to bottom, {colors.secondary} 60%,rgba(23, 156, 101, 0.16) 100%);",
        },
        boxBackground: {
          value: "#FFFFFF14",
        },
        borderColor: {
          value: "#FFFFFF1A",
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          value: "{colors.background}",
        },
        card: {
          value: "{colors.boxBackground}",
        },
        text: {
          value: "{colors.textPrimary}",
        },
        textSecondary: {
          value: "{colors.textSecondary}",
        },
        border: {
          value: "{colors.borderColor}",
        },
        accent: {
          value: "{colors.primary}",
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
