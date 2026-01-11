import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineRecipe,
} from "@chakra-ui/react";

const outline = {
  borderRadius: 8,
  borderColor: "primary.600",
  _hover: {
    background: "primary",
    transition: "all 0.3s ease-in-out",
    boxShadow: "0 8px 24px rgba(72, 187, 120, 0.2)",
    border: "1px solid borderColor",
  },
  fontWeight: "bold",
  color: "white",
  variant: "outline",
  background: "transparent",
};

export const buttonRecipe = defineRecipe({
  base: {
    borderRadius: "md",
    fontWeight: "bold",
  },
  variants: {
    visual: {
      outline,
      "outline-secondary": {
        ...outline,
        color: "primary",
        _hover: {
          ...outline._hover,
          color: "secondaryTextHover",
        },
      },
      solid: {
        background: "primary",
        _hover: {
          background: "primaryHover",
          transition: "all 0.3s ease-in-out",
        },
        fontWeight: "bold",
        color: "buttonText.500",
      },
    },
  },
});

const config = defineConfig({
  theme: {
    // =============== RECIPES
    recipes: {
      button: buttonRecipe,
    },
    breakpoints: {
      lg: "1280px",
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
        xs: { value: "4px" },
        sm: { value: "6px" },
        md: { value: "10px" },
        lg: { value: "16px" },
        xl: { value: "20px" },
      },

      // =============== COLORS
      colors: {
        primary: {
          value: "#20DC8E",
        },
        primaryHover: {
          value: "#179C65",
        },
        secondary: {
          value: "#08080A",
        },
        secondaryTextHover: {
          value: "#E0FFE6",
        },
        primaryTextValue: {
          value: "#FFFFFF",
        },
        secondaryTextValue: {
          value: "#A1A1AA",
        },
        background: {
          value:
            "linear-gradient(to bottom, {colors.secondary} 60%, #051f14 100%);",
        },
        boxBackground: {
          value: "#FFFFFF14",
        },
        borderColor: {
          value: "#FFFFFF1A",
        },
        buttonText: {
          500: {
            value: "#012C33",
          },
        },
      },
    },

    // ============== SEMANTIC TOKENS
    semanticTokens: {
      colors: {
        card: {
          value: "{colors.boxBackground}",
        },
        text: {
          value: "{colors.primaryTextValue}",
        },
        secondaryText: {
          value: "{colors.secondaryTextValue}",
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
  globalCss: {
    body: {
      color: "{colors.text}",
      background: "{colors.background}",
    },
  },
});

export const system = createSystem(defaultConfig, config);
