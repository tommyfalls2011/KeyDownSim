// Static App.js for sma-antenna.org
// No authentication, no backend - pure frontend simulator

import "@/App.css";
import { RFProvider } from "@/context/RFContextStatic";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/DashboardStatic";

function App() {
  return (
    <RFProvider>
      <Dashboard />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111216',
            border: '1px solid rgba(0,240,255,0.2)',
            color: '#e0e0e0',
            fontFamily: '"Exo 2", sans-serif',
          },
        }}
      />
    </RFProvider>
  );
}

export default App;
