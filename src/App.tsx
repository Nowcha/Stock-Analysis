import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { BuySignals } from "./components/BuySignals";
import { Portfolio } from "./components/Portfolio";
import { SellSignals } from "./components/SellSignals";
import { HistoryPage } from "./pages/HistoryPage";
import { StockDetail } from "./pages/StockDetail";

function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700">
      本ツールはスクリーニング補助ツールです。投資助言ではありません。パターン勝率は統計的参考値であり将来の結果を保証しません。最終的な売買判断はご自身の責任で行ってください。
    </div>
  );
}

function NavBar() {
  const btnClass = ({ isActive }: { isActive: boolean }) =>
    [
      "relative inline-flex items-center px-4 py-1.5 text-sm font-medium",
      "border border-gray-300 -ml-px transition-colors",
      "first:ml-0 first:rounded-l-md last:rounded-r-md",
      "focus:z-10 focus:outline-none",
      isActive
        ? "z-10 bg-blue-500 border-blue-500 text-white"
        : "bg-white text-gray-700 hover:bg-gray-50",
    ].join(" ");

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-bold text-gray-900 text-lg">
          Stock-Analysis
        </Link>
        <nav className="inline-flex">
          <NavLink to="/" end className={btnClass}>
            Buy
          </NavLink>
          <NavLink to="/sell" className={btnClass}>
            Sell
          </NavLink>
          <NavLink to="/history" className={btnClass}>
            History
          </NavLink>
          <NavLink to="/portfolio" className={btnClass}>
            Portfolio
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
