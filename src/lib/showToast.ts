import { toaster } from "staking-dashboard/components/ui/toaster";

// This function is to solve issue when calling
// toast function in useEffect or during render phase
// as the toast wouldn't work in useEffect and throw flushAsync error
export const showToast = (args: {
  method?: "create" | "update";
  id?: string;
  title: string;
  description?: string;
  type: "success" | "error" | "info" | "loading" | "warning";
  action?: {
    label: string;
    onClick: () => void;
  };
}) => {
  switch (args.method) {
    case "create":
      return requestAnimationFrame(() => {
        toaster.create({
          title: args.title,
          description: args.description,
          action: args.action,
          type: args.type,
        });
      });
    case "update":
      return requestAnimationFrame(() => {
        toaster.update(args.id || "", {
          title: args.title,
          description: args.description,
          action: args.action,
          type: args.type,
        });
      });

    // default to create
    default:
      return requestAnimationFrame(() => {
        toaster.create({
          title: args.title,
          description: args.description,
          action: args.action,
          type: args.type,
        });
      });
  }
};
