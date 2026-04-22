import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import PredictionPage from "./pages/PredictionPage";
import HistoryPage from "./pages/HistoryPage";
import InsightsPage from "./pages/InsightsPage";
import ModelComparisonPage from "./pages/ModelComparisonPage";
import FeatureImportancePage from "./pages/FeatureImportancePage";
import ExplainabilityPage from "./pages/ExplainabilityPage";
import AnomalyPage from "./pages/AnomalyPage";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<PredictionPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/model-comparison" element={<ModelComparisonPage />} />
        <Route path="/feature-importance" element={<FeatureImportancePage />} />
        <Route path="/explainability" element={<ExplainabilityPage />} />
        <Route path="/anomaly" element={<AnomalyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
