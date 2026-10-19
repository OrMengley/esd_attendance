import React from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { BranchProvider } from "./contexts/branch-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { router } from "./routes";
import { Toaster } from "sonner";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BranchProvider>
        <TooltipProvider delayDuration={0}>
          <RouterProvider router={router} />
        </TooltipProvider>
      </BranchProvider>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: "font-khmer text-xs",
        }}
      />
    </AuthProvider>
  );
};

export default App;
