import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import Dashboard from "@/pages/Dashboard";
import ModuleA from "@/pages/ModuleA";
import ModuleB from "@/pages/ModuleB";
import History from "@/pages/History";
import CostCenters from "@/pages/CostCenters";
import Categories from "@/pages/Categories";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="module-a" element={<ModuleA />} />
            <Route path="module-b" element={<ModuleB />} />
            <Route path="history" element={<History />} />
            <Route path="cost-centers" element={<CostCenters />} />
            <Route path="categories" element={<Categories />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
