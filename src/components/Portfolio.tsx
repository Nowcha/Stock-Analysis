import { useState } from "react";
import type { PortfolioEntry } from "../types";
import { usePortfolio } from "../hooks/usePortfolio";

const EMPTY_FORM: PortfolioEntry = {
  ticker: "",
  name: "",
  buy_date: "",
  buy_price: 0,
  quantity: 0,
  memo: "",
};

export function Portfolio() {
  const { portfolio, addEntry, removeEntry } = usePortfolio();
  const [form, setForm] = useState<PortfolioEntry>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PortfolioEntry, string>>>({});

  function validate(): boolean {
    const newErrors: Partial<Record<keyof PortfolioEntry, string>> = {};
    if (!form.ticker.trim()) newErrors.ticker = "銘柄コードを入力してください";
    if (!form.name.trim()) newErrors.name = "銘柄名を入力してください";
    if (!form.buy_date) newErrors.buy_date = "購入日を入力してください";
    if (form.buy_price <= 0) newErrors.buy_price = "購入価格を入力してください";
    if (form.quantity <= 0) newErrors.quantity = "数量を入力してください";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // Normalize ticker: add .T if missing
    const ticker = form.ticker.toUpperCase().endsWith(".T")
      ? form.ticker.toUpperCase()
      : `${form.ticker.toUpperCase()}.T`;
    addEntry({ ...form, ticker });
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">ポートフォリオ</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "キャンセル" : "+ 銘柄を追加"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
        >
          <h3 className="font-medium text-gray-800">銘柄を追加</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">銘柄コード *</label>
              <input
                type="text"
                placeholder="例: 7203"
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              />
              {errors.ticker && <p className="text-xs text-red-500 mt-0.5">{errors.ticker}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">銘柄名 *</label>
              <input
                type="text"
                placeholder="例: トヨタ自動車"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">購入日 *</label>
              <input
                type="date"
                value={form.buy_date}
                onChange={(e) => setForm({ ...form, buy_date: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              />
              {errors.buy_date && <p className="text-xs text-red-500 mt-0.5">{errors.buy_date}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">購入価格 (円) *</label>
              <input
                type="number"
                min={0}
                step={0.1}
                placeholder="例: 3500"
                value={form.buy_price || ""}
                onChange={(e) => setForm({ ...form, buy_price: parseFloat(e.target.value) || 0 })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              />
              {errors.buy_price && <p className="text-xs text-red-500 mt-0.5">{errors.buy_price}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">数量 (株) *</label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="例: 100"
                value={form.quantity || ""}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              />
              {errors.quantity && <p className="text-xs text-red-500 mt-0.5">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">メモ</label>
              <input
                type="text"
                placeholder="任意"
                value={form.memo ?? ""}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            追加する
          </button>
        </form>
      )}

      {portfolio.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">保有銘柄が登録されていません</p>
          <p className="text-sm text-gray-400 mt-1">
            銘柄を追加すると売りシグナルのフィルタリングができます
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {portfolio.map((entry) => (
            <div
              key={entry.ticker}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{entry.ticker}</span>
                  <span className="font-medium text-gray-900">{entry.name}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                  <span>購入日: {entry.buy_date}</span>
                  <span>購入価格: ¥{entry.buy_price.toLocaleString()}</span>
                  <span>{entry.quantity.toLocaleString()}株</span>
                  {entry.memo && <span className="text-gray-400">{entry.memo}</span>}
                </div>
              </div>
              <button
                onClick={() => removeEntry(entry.ticker)}
                className="ml-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                aria-label="削除"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
