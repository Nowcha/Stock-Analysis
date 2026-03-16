import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { BuySignals } from "./components/BuySignals";
import { Portfolio } from "./components/Portfolio";
import { SellSignals } from "./components/SellSignals";
import { HistoryPage } from "./pages/HistoryPage";
import { StockDetail } from "./pages/StockDetail";

function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700">
      譛ｬ繝・・繝ｫ縺ｯ繧ｹ繧ｯ繝ｪ繝ｼ繝九Φ繧ｰ陬懷勧繝・・繝ｫ縺ｧ縺吶よ兜雉・勧險縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲ゅヱ繧ｿ繝ｼ繝ｳ蜍晉紫縺ｯ邨ｱ險育噪蜿り・､縺ｧ縺ゅｊ蟆・擂縺ｮ邨先棡繧剃ｿ晁ｨｼ縺励∪縺帙ｓ縲よ怙邨ら噪縺ｪ螢ｲ雋ｷ蛻､譁ｭ縺ｯ縺碑・霄ｫ縺ｮ雋ｬ莉ｻ縺ｧ陦後▲縺ｦ縺上□縺輔＞縲・    </div>
  );
}

function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? "bg-blue-100 text-blue-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-bold text-gray-900 text-lg">
          Stock-Analysis
        </Link>
        <nav className="flex items-center gap-1 flex-wrap">
          <NavLink to="/" end className={linkClass}>
            雋ｷ縺・す繧ｰ繝翫Ν
          </NavLink>
          <NavLink to="/sell" className={linkClass}>
            螢ｲ繧翫す繧ｰ繝翫Ν
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            螻･豁ｴ
          </NavLink>
          <NavLink to="/portfolio" className={linkClass}>
            繝昴・繝医ヵ繧ｩ繝ｪ繧ｪ
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DisclaimerBanner />
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Routes>
          <Route path="/" element={<BuySignals />} />
          <Route path="/sell" element={<SellSignals />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
