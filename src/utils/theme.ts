import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineRecipe,
} from "@chakra-ui/react";

export const buttonRecipe = defineRecipe({
  base: {
    borderRadius: "md",
  },
});

const config = defineConfig({
  globalCss: {
    "html, body": {
      margin: 0,
      padding: 0,
      backgroundColor: "bg",
    },
  },
  theme: {
    // =============== RECIPES
    recipes: {
      button: buttonRecipe,
    },

    tokens: {
      // =============== FONT SIZES
      fontSizes: {
        sm: { value: "14px" },
        md: { value: "16px" },
        lg: { value: "18px" },
        xl: { value: "20px" },
      },

      // =============== BORDER RADIUS
      radii: {
        md: { value: "10px" },
        lg: { value: "16px" },
      },

      // =============== COLORS
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

    // ============== SEMANTIC TOKENS
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
