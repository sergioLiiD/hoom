
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import PromotersPage from "@/pages/PromotersPage";
import MapPage from "@/pages/MapPage";
import AnalysisPage from "@/pages/AnalysisPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/promoters" element={<Layout><PromotersPage /></Layout>} />
        <Route path="/map" element={<Layout><MapPage /></Layout>} />
        <Route path="/analysis" element={<Layout><AnalysisPage /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
