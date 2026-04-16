import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

const currency = value => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const categories = {
  coffee: 'Cà phê',
  tea: 'Trà',
  soda: 'Soda',
  juice: 'Nước ép',
  yogurt: 'Yaourt',
};

function Login({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('forever_token', data.token);
      localStorage.setItem('forever_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-200 flex items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-xl p-10">
        <div className="text-6xl font-black text-stone-200 mb-8">FOREVER</div>
        <h1 className="text-4xl font-black text-stone-900 mb-3">FOREVER POS PRO</h1>
        <p className="text-stone-700 mb-6">Đăng nhập hệ thống bán hàng internet</p>
        <input className="input mb-4" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Tài khoản" />
        <input className="input mb-4" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mật khẩu" />
        {error && <div className="mb-4 rounded-2xl bg-red-100 text-red-700 px-4 py-3">{error}</div>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        <div className="mt-6 text-stone-600 font-semibold">Admin: admin / 123456<br/>Staff: staff / 123456</div>
      </form>
    </div>
  );
}

function NotificationPanel({ notices }) {
  const enableNotifications = async () => {
    if (!('Notification' in window)) return alert('Trình duyệt không hỗ trợ notification');
    const permission = await Notification.requestPermission();
    alert(permission === 'granted' ? 'Đã bật notification' : 'Bạn chưa cấp quyền notification');
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">Thông báo bill</h3>
        <button className="btn-primary" onClick={enableNotifications}>Bật thông báo</button>
      </div>
      <div className="space-y-3 max-h-72 overflow-auto">
        {notices.length === 0 && <div className="text-stone-500">Chưa có thông báo</div>}
        {notices.map((n, idx) => (
          <div key={idx} className="rounded-2xl border border-stone-200 p-3">
            <div className="font-semibold">Bill #{n.orderId} - {n.tableCode}</div>
            <div className="text-sm text-stone-600">{currency(n.total)} đ - {n.paymentMethod}</div>
            <div className="text-xs text-stone-500">{new Date(n.at).toLocaleString('vi-VN')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppShell({ user, onLogout }) {
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [selectedTable, setSelectedTable] = useState('B1');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [summary, setSummary] = useState({ revenue_today: 0, revenue_month: 0, paid_bills_today: 0 });
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('bill:paid', data => {
      setNotices(prev => [data, ...prev].slice(0, 20));
      if (Notification.permission === 'granted') {
        new Notification(`Bill ${data.tableCode}`, {
          body: `${currency(data.total)} đ - ${data.paymentMethod}`,
        });
      }
      loadData();
    });
    socket.on('table:status', loadData);
    socket.on('order:updated', data => {
      setOpenOrders(prev => {
        const rest = prev.filter(x => x.id !== data.id);
        return [data, ...rest];
      });
      if (currentOrder?.id === data.id) setCurrentOrder(data);
      loadData();
    });
    return () => socket.disconnect();
  }, [currentOrder?.id]);

  async function loadData() {
    const [tablesData, productsData, ordersData, summaryData] = await Promise.all([
      api('/tables'), api('/products'), api('/orders/open'), api('/reports/summary')
    ]);
    setTables(tablesData);
    setProducts(productsData);
    setOpenOrders(ordersData);
    setSummary(summaryData);
    const selectedOpen = ordersData.find(o => o.table_code === selectedTable);
    setCurrentOrder(selectedOpen || null);
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const selectedOpen = openOrders.find(o => o.table_code === selectedTable);
    setCurrentOrder(selectedOpen || null);
  }, [selectedTable, openOrders]);

  const groupedProducts = useMemo(() => {
    return products.reduce((acc, p) => {
      (acc[p.category] ||= []).push(p);
      return acc;
    }, {});
  }, [products]);

  const ensureOrder = async () => {
    if (currentOrder) return currentOrder;
    const created = await api('/orders', { method: 'POST', body: JSON.stringify({ tableCode: selectedTable }) });
    await loadData();
    return created;
  };

  const addItem = async productId => {
    const order = await ensureOrder();
    await api(`/orders/${order.id}/items`, { method: 'POST', body: JSON.stringify({ productId, qty: 1 }) });
    const fresh = await api(`/orders/${order.id}`);
    setCurrentOrder(fresh);
    await loadData();
  };

  const payOrder = async () => {
    if (!currentOrder) return;
    await api(`/orders/${currentOrder.id}/pay`, { method: 'POST', body: JSON.stringify({ paymentMethod: 'cash' }) });
    setCurrentOrder(null);
    await loadData();
  };

  const tableStatus = code => tables.find(t => t.code === code)?.status || 'empty';

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-6">
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="card p-4">
            <div className="text-sm text-stone-500">Xin chào</div>
            <div className="text-2xl font-black text-stone-900">{user.fullName}</div>
            <div className="text-stone-600 mb-4">{user.role}</div>
            <button className="btn-primary w-full" onClick={() => { localStorage.clear(); onLogout(); }}>Đăng xuất</button>
          </div>
          <div className="card p-4">
            <div className="font-bold text-lg mb-3">Sảnh chờ</div>
            <div className="grid grid-cols-2 gap-3">
              {['B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','MANG_VE','GIAO_DI'].map(code => {
                const active = selectedTable === code;
                const status = tableStatus(code);
                const statusColor = status === 'serving' ? 'bg-amber-100 border-amber-400' : status === 'waiting_payment' ? 'bg-red-100 border-red-400' : 'bg-white border-stone-200';
                return (
                  <button key={code} onClick={() => setSelectedTable(code)} className={`rounded-2xl border p-4 text-left ${statusColor} ${active ? 'ring-2 ring-stone-900' : ''}`}>
                    <div className="font-bold">{code}</div>
                    <div className="text-xs text-stone-500">{status}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-4"><div className="text-stone-500 text-sm">Doanh thu hôm nay</div><div className="text-2xl font-black">{currency(summary.revenue_today)} đ</div></div>
            <div className="card p-4"><div className="text-stone-500 text-sm">Bill hôm nay</div><div className="text-2xl font-black">{summary.paid_bills_today}</div></div>
            <div className="card p-4"><div className="text-stone-500 text-sm">Doanh thu tháng</div><div className="text-2xl font-black">{currency(summary.revenue_month)} đ</div></div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-stone-500 text-sm">Bàn đang chọn</div>
                <div className="text-3xl font-black">{selectedTable}</div>
              </div>
              <button className="btn-primary" onClick={payOrder} disabled={!currentOrder}>Thanh toán</button>
            </div>
            <div className="space-y-3">
              {(currentOrder?.items || []).length === 0 && <div className="text-stone-500">Chưa có món trong đơn.</div>}
              {(currentOrder?.items || []).map(item => (
                <div key={item.id} className="rounded-2xl border border-stone-200 p-3 flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.product_name}</div>
                    <div className="text-sm text-stone-500">SL {item.qty} × {currency(item.unit_price)} đ</div>
                  </div>
                  <div className="font-bold">{currency(item.line_total)} đ</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between text-xl font-black">
              <span>Tổng</span>
              <span>{currency(currentOrder?.total || 0)} đ</span>
            </div>
          </div>

          <div className="card p-4">
            <div className="font-bold text-lg mb-4">Menu</div>
            <div className="space-y-5">
              {Object.entries(groupedProducts).map(([category, list]) => (
                <div key={category}>
                  <div className="font-bold text-stone-700 mb-2">{categories[category] || category}</div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {list.map(p => (
                      <button key={p.id} onClick={() => addItem(p.id)} className="rounded-2xl border border-stone-200 p-4 text-left hover:bg-stone-50">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-stone-500 text-sm">{currency(p.price)} đ</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <NotificationPanel notices={notices} />
          <div className="card p-4">
            <h3 className="font-bold text-lg mb-3">Ghi chú production</h3>
            <ul className="space-y-2 text-sm text-stone-600 list-disc pl-5">
              <li>Dùng PostgreSQL thật, không dùng db.json</li>
              <li>JWT + CORS + Helmet sẵn</li>
              <li>Socket.IO đồng bộ bill realtime</li>
              <li>Phù hợp deploy internet qua Render/Netlify/VPS</li>
              <li>Nền PWA cho iPhone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('forever_user')); } catch { return null; }
  });
  if (!user) return <Login onLogin={setUser} />;
  return <AppShell user={user} onLogout={() => setUser(null)} />;
}
