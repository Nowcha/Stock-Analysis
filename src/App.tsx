import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { BuySignals } from "./components/BuySignals";
import { Portfolio } from "./components/Portfolio";
import { SellSignals } from "./components/SellSignals";

function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700">
      本ツールはスクリーニング補助ツールです。投資助言ではありません。パターン勝率は統計的参考値であり将来の結果を保証しません。最終的な売買判断はご自身の責任で行ってください。
    </div>
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
          KabuPattern
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            買いシグナル
          </NavLink>
          <NavLink to="/sell" className={linkClass}>
            売りシグナル
          </NavLink>
          <NavLink to="/portfolio" className={linkClass}>
            ポートフォリオ
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
          <Route path="/portfolio" element={<Portfolio />} />
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
