
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TEXTS } from './constants';
import { Language, InventoryItem, OrderItem, Order, OrderStatus, AdminSettings, PackConfig } from './types';
import { api } from './services/api';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-500' },
  PROCESSING: { label: 'Processing', color: 'bg-yellow-500' },
  SHIPPED: { label: 'Shipped', color: 'bg-purple-500' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-500' },
  CANCELED: { label: 'Canceled', color: 'bg-red-500' }
};

const ALL_STATUSES: OrderStatus[] = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'];

interface ImageAsset {
  id: string;
  category: string;
  ref_key: string;
  image_url: string;
  sort_order: number;
}

const ImageUploadButton: React.FC<{
  label: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  onDelete?: () => void;
}> = ({ label, currentUrl, onUploaded, onDelete }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const { uploadURL, objectPath } = await api.requestUploadUrl({ name: file.name, size: file.size, type: file.type });
      await fetch(uploadURL, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      onUploaded(objectPath);
    } catch (err) {
      alert('Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center relative group">
        {currentUrl ? (
          <img src={currentUrl} className="w-full h-full object-cover" alt={label} />
        ) : (
          <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      <div className="flex gap-1">
        <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all text-center">
          {uploading ? 'Uploading...' : (currentUrl ? 'Change' : 'Upload')}
          <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={uploading} />
        </label>
        {currentUrl && onDelete && (
          <button onClick={onDelete} className="bg-red-500/20 hover:bg-red-500/40 px-2 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black transition-all" title="Remove">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        )}
      </div>
      <span className="text-[8px] sm:text-[9px] opacity-40 font-bold text-center truncate w-full">{label}</span>
    </div>
  );
};

const AdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.adminLogin(username, password);
      onLogin();
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-slate-800 border border-white/10 rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Login</h1>
          <p className="text-white/40 text-sm mt-1">Cupify Dashboard</p>
        </div>
        {error && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-bold rounded-xl px-4 py-3 text-center">{error}</div>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-[#FF4D4D] transition-all placeholder:text-white/20"
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-[#FF4D4D] transition-all placeholder:text-white/20"
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full bg-[#FF4D4D] text-white font-black py-3 rounded-xl uppercase tracking-widest text-sm hover:bg-[#ff3333] transition-all disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

const AdminDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'packs' | 'settings' | 'images'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [imageAssets, setImageAssets] = useState<ImageAsset[]>([]);
  const [packConfigs, setPackConfigs] = useState<PackConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, invData, settingsData, imagesData, packsData] = await Promise.all([
          api.getAdminOrders(),
          api.getInventory(),
          api.getSettings(),
          api.getImages(),
          api.getPacks()
        ]);
        setOrders(ordersData);
        setInventory(invData);
        setSettings(settingsData);
        setImageAssets(imagesData);
        setPackConfigs(packsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getImageUrl = (category: string, refKey: string, sortOrder: number = 0): string | undefined => {
    const asset = imageAssets.find(a => a.category === category && a.ref_key === refKey && a.sort_order === sortOrder);
    return asset?.image_url;
  };

  const handleImageUploaded = async (category: string, refKey: string, objectPath: string, sortOrder: number = 0) => {
    try {
      await api.saveImage({ category, ref_key: refKey, image_url: objectPath, sort_order: sortOrder });
      const updatedImages = await api.getImages();
      setImageAssets(updatedImages);
    } catch (err) {
      alert('Failed to save image');
    }
  };

  const handleImageDelete = async (category: string, refKey: string, sortOrder: number = 0) => {
    const asset = imageAssets.find(a => a.category === category && a.ref_key === refKey && a.sort_order === sortOrder);
    if (!asset) return;
    try {
      await api.deleteImage(asset.id);
      const updatedImages = await api.getImages();
      setImageAssets(updatedImages);
    } catch (err) {
      alert('Failed to delete image');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleUpdateStock = async (colorCode: string, newStock: number) => {
    if (isNaN(newStock) || newStock < 0) return;
    try {
      await api.updateStock(colorCode, newStock);
      setInventory(prev => prev.map(item =>
        item.colorCode === colorCode ? { ...item, stock: newStock } : item
      ));
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      await api.updateSettings(settings);
      alert('Settings saved!');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredOrders = statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter);

  const orderStats = useMemo(() => {
    const total = orders.length;
    const confirmed = orders.filter(o => o.status === 'CONFIRMED').length;
    const processing = orders.filter(o => o.status === 'PROCESSING').length;
    const shipped = orders.filter(o => o.status === 'SHIPPED').length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    const canceled = orders.filter(o => o.status === 'CANCELED').length;
    const revenue = orders.filter(o => o.status !== 'CANCELED').reduce((s, o) => s + o.totalPrice, 0);
    return { total, confirmed, processing, shipped, delivered, canceled, revenue };
  }, [orders]);

  if (loading) return <div className="h-full flex items-center justify-center text-white text-lg">Loading Admin...</div>;

  return (
    <div className="h-full bg-slate-900 text-white overflow-auto ios-scroll">
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black tracking-tight">Admin Panel</h1>
          <button onClick={onBack} className="bg-red-500/20 border border-red-500/30 px-5 py-2 rounded-xl font-bold text-sm hover:bg-red-500/30 transition-all text-red-300">Logout</button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(['orders', 'inventory', 'packs', 'images', 'settings'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tab ? 'bg-[#FF4D4D] shadow-lg' : 'bg-white/5 hover:bg-white/10'}`}>
              {tab === 'orders' ? `Orders (${orders.length})` : tab === 'inventory' ? 'Inventory' : tab === 'packs' ? 'Packs' : tab === 'images' ? 'Images' : 'Settings'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'orders' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Total Orders</p>
                <p className="text-2xl font-black mt-1">{orderStats.total}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Revenue</p>
                <p className="text-2xl font-black mt-1 text-green-400">{orderStats.revenue} AED</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Active</p>
                <p className="text-2xl font-black mt-1 text-blue-400">{orderStats.confirmed + orderStats.processing + orderStats.shipped}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Delivered</p>
                <p className="text-2xl font-black mt-1 text-emerald-400">{orderStats.delivered}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
              <button onClick={() => setStatusFilter('ALL')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${statusFilter === 'ALL' ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}>
                All ({orders.length})
              </button>
              {ALL_STATUSES.map(s => {
                const count = orders.filter(o => o.status === s).length;
                return (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}>
                    {STATUS_CONFIG[s].label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {filteredOrders.length === 0 && (
                <div className="text-center py-10 opacity-40 text-sm">No orders found</div>
              )}
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-4 cursor-pointer hover:bg-white/5 transition-all" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 w-2 h-2 rounded-full ${STATUS_CONFIG[order.status]?.color || 'bg-gray-500'}`}></span>
                        <span className="text-[#FF4D4D] font-black text-sm">{order.orderCode}</span>
                        <span className="font-bold text-sm truncate">{order.customer?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold opacity-60">{order.totalPrice} AED</span>
                        <svg className={`w-4 h-4 opacity-40 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 ml-5">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${STATUS_CONFIG[order.status]?.color || 'bg-gray-500'}`}>{STATUS_CONFIG[order.status]?.label || order.status}</span>
                      <span className="text-[10px] opacity-40">{order.packSize} Cups</span>
                      <span className="text-[10px] opacity-40">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="border-t border-white/10 p-4 bg-black/20 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Customer</p>
                          <p className="font-bold">{order.customer?.name || 'N/A'}</p>
                          <p className="opacity-60 text-xs">{order.customer?.mobile || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Delivery</p>
                          <p className="font-bold">{order.customer?.city || 'N/A'}</p>
                          <p className="opacity-60 text-xs">{order.customer?.address || 'N/A'}</p>
                          <p className="opacity-40 text-[10px] mt-0.5">{order.customer?.preferredTime || 'N/A'}</p>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Items</p>
                          <div className="flex gap-2 flex-wrap">
                            {order.items.map((item: any, idx: number) => {
                              const inv = inventory.find(i => i.colorCode === item.colorCode);
                              return (
                                <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                                  {inv && <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20"><img src={getImageUrl('color', inv.colorCode) || ''} className="w-full h-full object-cover" alt="" /></div>}
                                  <span className="text-xs font-bold">{inv?.nameEn || item.colorCode}</span>
                                  <span className="text-[10px] opacity-40">x{item.qty}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Update Status</p>
                        <div className="flex gap-2 flex-wrap">
                          {ALL_STATUSES.map(s => (
                            <button key={s} onClick={() => handleUpdateStatus(order.id, s)} disabled={order.status === s} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${order.status === s ? `${STATUS_CONFIG[s].color} shadow-lg` : 'bg-white/5 hover:bg-white/10 opacity-60 hover:opacity-100'}`}>
                              {STATUS_CONFIG[s].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Total Items</p>
                <p className="text-2xl font-black mt-1">{inventory.length}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Total Stock</p>
                <p className="text-2xl font-black mt-1">{inventory.reduce((s, i) => s + i.stock, 0)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Low Stock (below 10)</p>
                <p className="text-2xl font-black mt-1 text-yellow-400">{inventory.filter(i => i.stock < 10).length}</p>
              </div>
            </div>
            {inventory.map(item => {
              return (
                <div key={item.colorCode} className={`flex items-center justify-between p-4 bg-white/5 rounded-xl border transition-all ${item.stock < 10 ? 'border-yellow-500/30' : 'border-white/10'}`}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden shrink-0">
                      <img src={getImageUrl('color', item.colorCode) || ''} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <input
                        type="text"
                        value={item.nameEn}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInventory(prev => prev.map(inv => inv.colorCode === item.colorCode ? { ...inv, nameEn: val } : inv));
                        }}
                        onBlur={() => api.updateInventoryNames(item.colorCode, item.nameAr, item.nameEn).catch(() => alert('Failed to save name'))}
                        className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-sm font-bold hover:border-white/30 focus:border-white/50 focus:outline-none transition-colors w-full"
                        placeholder="English name"
                      />
                      <input
                        type="text"
                        value={item.nameAr}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInventory(prev => prev.map(inv => inv.colorCode === item.colorCode ? { ...inv, nameAr: val } : inv));
                        }}
                        onBlur={() => api.updateInventoryNames(item.colorCode, item.nameAr, item.nameEn).catch(() => alert('Failed to save name'))}
                        className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs opacity-60 hover:border-white/30 focus:border-white/50 focus:outline-none focus:opacity-100 transition-all w-full"
                        dir="rtl"
                        placeholder="الاسم بالعربي"
                      />
                      {item.stock < 10 && <span className="text-[9px] font-black text-yellow-400 uppercase">Low Stock</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleUpdateStock(item.colorCode, Math.max(0, item.stock - 1))} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all font-bold">-</button>
                    <input
                      type="number"
                      value={item.stock}
                      onChange={(e) => handleUpdateStock(item.colorCode, parseInt(e.target.value) || 0)}
                      className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-center font-black text-lg"
                    />
                    <button onClick={() => handleUpdateStock(item.colorCode, item.stock + 1)} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all font-bold">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="max-w-2xl space-y-8">
            <section className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="font-black text-lg mb-1">Pack Images</h3>
              <p className="text-[10px] opacity-40 font-bold mb-4">Upload images for each pack size shown on the selection screen</p>
              <div className="flex gap-4 sm:gap-6 flex-wrap">
                {packConfigs.map(pack => (
                  <ImageUploadButton
                    key={pack.size}
                    label={`${pack.size}-Cup Pack`}
                    currentUrl={getImageUrl('pack', String(pack.size))}
                    onUploaded={(url) => handleImageUploaded('pack', String(pack.size), url)}
                    onDelete={() => handleImageDelete('pack', String(pack.size))}
                  />
                ))}
              </div>
            </section>

            <section className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="font-black text-lg mb-1">Cup Color Images</h3>
              <p className="text-[10px] opacity-40 font-bold mb-4">Main thumbnail for each cup color</p>
              <div className="flex gap-4 sm:gap-6 flex-wrap">
                {inventory.map(item => (
                    <ImageUploadButton
                      key={item.colorCode}
                      label={item.nameEn}
                      currentUrl={getImageUrl('color', item.colorCode)}
                      onUploaded={(url) => handleImageUploaded('color', item.colorCode, url)}
                      onDelete={() => handleImageDelete('color', item.colorCode)}
                    />
                ))}
              </div>
            </section>

            <section className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="font-black text-lg mb-1">Cup Gallery Images</h3>
              <p className="text-[10px] opacity-40 font-bold mb-4">Extra images shown when a customer previews a cup color (up to 3 per color)</p>
              {inventory.map(item => {
                return (
                <div key={item.colorCode} className="mb-6 last:mb-0">
                  <p className="font-bold text-sm mb-3 opacity-70">{item.nameEn} ({item.nameAr})</p>
                  <div className="flex gap-4 sm:gap-6 flex-wrap">
                    {[0, 1, 2].map(idx => (
                      <ImageUploadButton
                        key={idx}
                        label={`Slide ${idx + 1}`}
                        currentUrl={getImageUrl('gallery', item.colorCode, idx)}
                        onUploaded={(url) => handleImageUploaded('gallery', item.colorCode, url, idx)}
                        onDelete={() => handleImageDelete('gallery', item.colorCode, idx)}
                      />
                    ))}
                  </div>
                </div>
                );
              })}
            </section>
          </div>
        )}

        {activeTab === 'packs' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Total Packs</p>
                <p className="text-2xl font-black mt-1">{packConfigs.length}</p>
              </div>
            </div>
            {packConfigs.map(pack => (
              <div key={pack.size} className="bg-white/5 rounded-xl border border-white/10 p-5">
                <h3 className="font-black text-lg mb-4">{pack.size}-Cup Pack</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1">Title (Arabic)</label>
                    <input
                      type="text"
                      value={pack.titleAr}
                      onChange={e => {
                        const updated = packConfigs.map(p => p.size === pack.size ? { ...p, titleAr: e.target.value } : p);
                        setPackConfigs(updated);
                      }}
                      onBlur={() => api.updatePack(pack.size, { titleAr: pack.titleAr }).catch(console.error)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[#FF4D4D] transition-all font-arabic text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1">Title (English)</label>
                    <input
                      type="text"
                      value={pack.titleEn}
                      onChange={e => {
                        const updated = packConfigs.map(p => p.size === pack.size ? { ...p, titleEn: e.target.value } : p);
                        setPackConfigs(updated);
                      }}
                      onBlur={() => api.updatePack(pack.size, { titleEn: pack.titleEn }).catch(console.error)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[#FF4D4D] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1">Description (Arabic)</label>
                    <input
                      type="text"
                      value={pack.descAr}
                      onChange={e => {
                        const updated = packConfigs.map(p => p.size === pack.size ? { ...p, descAr: e.target.value } : p);
                        setPackConfigs(updated);
                      }}
                      onBlur={() => api.updatePack(pack.size, { descAr: pack.descAr }).catch(console.error)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[#FF4D4D] transition-all font-arabic text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1">Description (English)</label>
                    <input
                      type="text"
                      value={pack.descEn}
                      onChange={e => {
                        const updated = packConfigs.map(p => p.size === pack.size ? { ...p, descEn: e.target.value } : p);
                        setPackConfigs(updated);
                      }}
                      onBlur={() => api.updatePack(pack.size, { descEn: pack.descEn }).catch(console.error)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[#FF4D4D] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1">Badge</label>
                    <input
                      type="text"
                      value={pack.badge}
                      onChange={e => {
                        const updated = packConfigs.map(p => p.size === pack.size ? { ...p, badge: e.target.value } : p);
                        setPackConfigs(updated);
                      }}
                      onBlur={() => api.updatePack(pack.size, { badge: pack.badge }).catch(console.error)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[#FF4D4D] transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <div className="max-w-lg space-y-6">
            <section className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="font-black text-lg mb-4">Pack Prices (AED)</h3>
              <div className="space-y-3">
                {Object.entries(settings.pack_prices).map(([size, price]) => (
                  <div key={size} className="flex items-center justify-between">
                    <span className="font-bold text-sm">{size} Cups Pack</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, pack_prices: { ...prev.pack_prices, [size]: parseInt(e.target.value) || 0 } } : prev)}
                      className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-center font-black"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="font-black text-lg mb-4">Delivery</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Delivery Fee (AED)</span>
                  <input
                    type="number"
                    value={settings.delivery_fee}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, delivery_fee: parseInt(e.target.value) || 0 } : prev)}
                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-center font-black"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="font-black text-lg mb-4">WhatsApp</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-sm shrink-0">Number</span>
                  <input
                    type="text"
                    value={settings.whatsapp_number}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, whatsapp_number: e.target.value } : prev)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 font-bold text-sm"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="font-black text-lg mb-4">Store</h3>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Store Active</span>
                <button
                  onClick={() => setSettings(prev => prev ? { ...prev, store_active: !prev.store_active } : prev)}
                  className={`w-14 h-7 rounded-full transition-all relative ${settings.store_active ? 'bg-green-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.store_active ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>
            </section>

            <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full bg-[#FF4D4D] py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50">
              {savingSettings ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('lang');
    return (saved as Language) || 'ar';
  });

  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [packSize, setPackSize] = useState<number | null>(3);
  const [selectedColors, setSelectedColors] = useState<OrderItem[]>([]);
  const [showRandomHint, setShowRandomHint] = useState(false);
  const [inspectColor, setInspectColor] = useState<string | null>(null);
  const [liveNotif, setLiveNotif] = useState<string | null>(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [storeSettings, setStoreSettings] = useState<AdminSettings | null>(null);
  const [imageAssets, setImageAssets] = useState<ImageAsset[]>([]);
  const [packConfigs, setPackConfigs] = useState<PackConfig[]>([]);
  const [appReady, setAppReady] = useState(false);

  const [customer, setCustomer] = useState({
    name: '', mobile: '', city: '', address: '', preferredTime: 'Morning' as 'Morning' | 'Evening'
  });
  const [agree, setAgree] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const t = TEXTS[lang];
  const isRtl = lang === 'ar';

  const imageCacheRef = React.useRef<Map<string, HTMLImageElement>>(new Map());

  const preloadImage = useCallback((url: string) => {
    if (!url || imageCacheRef.current.has(url)) return;
    const img = new Image();
    img.src = url;
    imageCacheRef.current.set(url, img);
  }, []);

  useEffect(() => {
    imageAssets.forEach(asset => {
      if (asset.image_url) preloadImage(asset.image_url);
    });
  }, [imageAssets, preloadImage]);

  const getImage = useCallback((category: string, refKey: string, sortOrder: number = 0): string | undefined => {
    const asset = imageAssets.find(a => a.category === category && a.ref_key === refKey && a.sort_order === sortOrder);
    return asset?.image_url;
  }, [imageAssets]);

  const getPackImage = useCallback((size: number): string => {
    return getImage('pack', String(size)) || '';
  }, [getImage]);

  const getColorImage = useCallback((code: string): string => {
    return getImage('color', code) || '';
  }, [getImage]);

  const getGalleryImages = useCallback((code: string): string[] => {
    const dynamicGallery: string[] = [];
    for (let i = 0; i < 3; i++) {
      const img = getImage('gallery', code, i);
      if (img) dynamicGallery.push(img);
    }
    return dynamicGallery;
  }, [getImage]);

  const dynamicPrices = useMemo(() => {
    if (storeSettings?.pack_prices) {
      return Object.fromEntries(Object.entries(storeSettings.pack_prices).map(([k, v]) => [Number(k), v]));
    }
    return {};
  }, [storeSettings]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [settingsData, inventoryData, imagesData, packsData] = await Promise.all([
          api.getPublicSettings().catch(err => { console.error("Failed to load settings", err); return null; }),
          api.getInventory().catch(err => { console.error("Inventory load failed", err); return [] as InventoryItem[]; }),
          api.getImages().catch(err => { console.error("Image assets load failed", err); return [] as ImageAsset[]; }),
          api.getPacks().catch(err => { console.error("Packs load failed", err); return [] as PackConfig[]; })
        ]);
        if (settingsData) setStoreSettings(settingsData);
        setInventory(inventoryData);
        setImageAssets(imagesData);
        setPackConfigs(packsData);
        const defaultSize = 3;
        const avail = inventoryData.filter((i: InventoryItem) => i.stock > 0);
        if (avail.length > 0) {
          const randomItems: OrderItem[] = [];
          let rem = defaultSize;
          const shuffled = [...avail].sort(() => Math.random() - 0.5);
          for (const item of shuffled) {
            if (rem <= 0) break;
            randomItems.push({ colorCode: item.colorCode, qty: 1 });
            rem--;
          }
          if (rem > 0) {
            for (const item of shuffled) {
              if (rem <= 0) break;
              const ex = randomItems.find(r => r.colorCode === item.colorCode);
              const cq = ex ? ex.qty : 0;
              const canAdd = Math.min(rem, item.stock - cq);
              if (canAdd > 0) { if (ex) ex.qty += canAdd; else randomItems.push({ colorCode: item.colorCode, qty: canAdd }); rem -= canAdd; }
            }
          }
          setSelectedColors(randomItems);
          setShowRandomHint(true);
        }
      } catch (err) {
        console.error("Initial load error", err);
      }
      setAppReady(true);
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (!appReady) return;
    const syncInv = () => {
      api.getInventory()
        .then(setInventory)
        .catch(err => console.error("Postgres Error: Inventory sync failed silently.", err));
    };
    const invInterval = setInterval(syncInv, 10000);
    return () => clearInterval(invInterval);
  }, [appReady]);

  useEffect(() => {
    let activityQueue: string[] = [];
    let index = 0;

    const fetchActivity = async () => {
      try {
        const data = await api.getLiveActivity(lang);
        activityQueue = data;
        index = 0;
      } catch (e) {
        console.error("Postgres Error: Failed to fetch live activity stream.", e);
      }
    };

    fetchActivity();
    const displayInterval = setInterval(() => {
      if (activityQueue.length > 0) {
        setLiveNotif(activityQueue[index]);
        index = (index + 1) % activityQueue.length;
        if (index === 0) fetchActivity();
        setTimeout(() => setLiveNotif(null), 4000);
      }
    }, 12000);

    return () => clearInterval(displayInterval);
  }, [lang]);

  // 2. إدارة صور المعاينة (Gallery Auto-play)
  useEffect(() => {
    if (!inspectColor) {
      setActiveImgIndex(0);
      return;
    }
    const gallery = getGalleryImages(inspectColor);
    if (gallery.length <= 1) return;
    const timer = setInterval(() => setActiveImgIndex(prev => (prev + 1) % gallery.length), 4000);
    return () => clearInterval(timer);
  }, [inspectColor, getGalleryImages]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [lang, isRtl]);

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');
  const handleSelectPack = (size: number) => {
    setPackSize(size);
    const available = inventory.filter(i => i.stock > 0);
    if (available.length > 0) {
      const randomItems: OrderItem[] = [];
      let remaining = size;
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      for (const item of shuffled) {
        if (remaining <= 0) break;
        const qty = Math.min(1, remaining, item.stock);
        randomItems.push({ colorCode: item.colorCode, qty });
        remaining -= qty;
      }
      if (remaining > 0 && shuffled.length > 0) {
        for (const item of shuffled) {
          if (remaining <= 0) break;
          const existing = randomItems.find(r => r.colorCode === item.colorCode);
          const currentQty = existing ? existing.qty : 0;
          const canAdd = Math.min(remaining, item.stock - currentQty);
          if (canAdd > 0) {
            if (existing) existing.qty += canAdd;
            else randomItems.push({ colorCode: item.colorCode, qty: canAdd });
            remaining -= canAdd;
          }
        }
      }
      setSelectedColors(randomItems);
      setShowRandomHint(true);
    } else {
      setSelectedColors([]);
      setShowRandomHint(false);
    }
    setStep(1);
  };

  // 3. منطق إضافة الألوان مع التحقق من المخزون المتوفر في Postgres
  const handleAddColor = (colorCode: string) => {
    if (!packSize) return;
    setShowRandomHint(false);
    const inv = inventory.find(i => i.colorCode === colorCode);
    const currentSelectedQty = selectedColors.find(i => i.colorCode === colorCode)?.qty || 0;
    
    if (inv && currentSelectedQty >= inv.stock) {
      // لا توجد كمية كافية
      console.warn(`Postgres Protection: Insufficient stock for ${colorCode}`);
      return;
    }

    const totalCount = selectedColors.reduce((sum, i) => sum + i.qty, 0);
    if (totalCount >= packSize) return;

    setSelectedColors(prev => {
      const existingIndex = prev.findIndex(i => i.colorCode === colorCode);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], qty: updated[existingIndex].qty + 1 };
        return updated;
      }
      return [...prev, { colorCode, qty: 1 }];
    });
  };

  const handleRemoveColor = (colorCode: string) => {
    setShowRandomHint(false);
    setSelectedColors(prev => {
      const existingIndex = prev.findIndex(i => i.colorCode === colorCode);
      if (existingIndex === -1) return prev;
      const updated = [...prev];
      if (updated[existingIndex].qty > 1) {
        updated[existingIndex] = { ...updated[existingIndex], qty: updated[existingIndex].qty - 1 };
      } else {
        updated.splice(existingIndex, 1);
      }
      return updated;
    });
  };

  const selectedCount = useMemo(() => selectedColors.reduce((sum, i) => sum + i.qty, 0), [selectedColors]);
  const selectedList = useMemo(() => {
    const list: string[] = [];
    selectedColors.forEach(item => { for (let i = 0; i < item.qty; i++) list.push(item.colorCode); });
    return list;
  }, [selectedColors]);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.mobile || !agree) {
      alert(t.validationError);
      return;
    }
    setLoading(true);
    try {
      const order = await api.createOrder({
        language: lang, packSize: packSize!, items: selectedColors, customer: customer as any
      });
      setConfirmedOrder(order);
    } catch (err: any) {
      console.error("Postgres Order Error:", err);
      alert(err.message || (isRtl ? "عذراً، المخزون قد تغير للتو. يرجى مراجعة اختيارك." : "Sorry, stock levels changed. Please review your selection."));
      // إعادة مزامنة المخزون فوراً عند حدوث خطأ
      api.getInventory().then(setInventory);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = (step / 2) * 100;

  if (confirmedOrder) {
    const getColorName = (code: string) => inventory.find(i => i.colorCode === code)?.[lang === 'ar' ? 'nameAr' : 'nameEn'] || code;
    const itemsLine = confirmedOrder.items.map(i => `• ${getColorName(i.colorCode)} x${i.qty}`).join('\n');
    const preferredTimeLabel = confirmedOrder.customer.preferredTime === 'Morning' ? t.morning : t.evening;
    const whatsappBody = lang === 'ar'
      ? `*طلب جديد - Cupify*\n\n${t.orderCode}: ${confirmedOrder.orderCode}\n*الحجم:* ${confirmedOrder.packSize} ${t.cups}\n\n*الألوان:*\n${itemsLine}\n\n*العميل:*\n${confirmedOrder.customer.name}\n${confirmedOrder.customer.mobile}\n${confirmedOrder.customer.city}\n${confirmedOrder.customer.address}\n${t.morning}/${t.evening}: ${preferredTimeLabel}\n\n*الإجمالي:* ${confirmedOrder.totalPrice} ${t.aed}`
      : `*New order - Cupify*\n\n${t.orderCode}: ${confirmedOrder.orderCode}\n*Pack:* ${confirmedOrder.packSize} ${t.cups}\n\n*Items:*\n${itemsLine}\n\n*Customer:*\n${confirmedOrder.customer.name}\n${confirmedOrder.customer.mobile}\n${confirmedOrder.customer.city}\n${confirmedOrder.customer.address}\nPreferred: ${preferredTimeLabel}\n\n*Total:* ${confirmedOrder.totalPrice} ${t.aed}`;
    const whatsappUrl = `https://wa.me/${(storeSettings?.whatsapp_number || '').replace(/\D/g, '')}?text=${encodeURIComponent(whatsappBody)}`;

    return (
      <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center animate-scale-up">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 sm:mb-8 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
           <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-3 sm:mb-4">{t.successTitle}</h1>
        <p className="opacity-60 mb-8 sm:mb-10 text-xs sm:text-sm font-bold tracking-widest">{t.orderCode}: <span className="text-[#FF4D4D] opacity-100">{confirmedOrder.orderCode}</span></p>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full max-w-xs bg-[#25D366] py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black text-base sm:text-lg shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          {t.whatsappMsg}
        </a>
      </div>
    );
  }

  if (!appReady) {
    return (
      <div className={`h-full flex flex-col items-center justify-center gap-4 ${isRtl ? 'font-arabic' : ''}`}>
        <div className="w-14 h-14 bg-[#FF4D4D] rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg animate-pulse">C</div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-black text-lg tracking-tighter uppercase italic">Cupify</span>
          <span className="text-[8px] font-bold opacity-40 uppercase tracking-[0.2em]">{isRtl ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#FF4D4D] rounded-full animate-spin mt-2"></div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${isRtl ? 'font-arabic' : ''}`}>
      {/* 4. الهيدر المحسن (Modern Floating Header) */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-[100] bg-white/5">
        <div className="h-full bg-gradient-to-r from-[#FF4D4D] to-[#4834D4] transition-all duration-700 ease-out shadow-[0_0_10px_#FF4D4D]" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <header className="fixed top-2 left-3 right-3 sm:top-4 sm:left-6 sm:right-6 z-[90] flex items-center justify-between p-2.5 sm:p-3.5 glass-container shadow-2xl border-white/10 rounded-2xl sm:rounded-[2rem]">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setStep(0); setPackSize(null); setSelectedColors([]); }}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FF4D4D] rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-xl shadow-lg transition-transform group-hover:rotate-12">C</div>
          <div className="flex flex-col">
            <span className="font-black text-sm sm:text-lg tracking-tighter uppercase italic leading-none">Cupify</span>
            <span className="text-[6px] sm:text-[7px] font-black opacity-40 uppercase tracking-[0.15em] sm:tracking-[0.2em]">{isRtl ? 'الفخامة في أكوابك' : 'Luxury in every sip'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={toggleLang} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 border border-white/10 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl uppercase tracking-widest hover:bg-white/20 transition-all">{lang === 'ar' ? 'EN' : 'عربي'}</button>
        </div>
      </header>

      <div className="h-20 sm:h-28 shrink-0"></div>

      <div className="h-8 sm:h-10 flex justify-center shrink-0">
        {liveNotif && (
          <div className="bg-white/5 backdrop-blur-md px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black flex items-center gap-2 animate-bounce border border-white/10 shadow-xl">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></span>
            {liveNotif}
          </div>
        )}
      </div>

      <main className="flex-1 relative overflow-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
        {step === 0 && (
          <section className="h-full flex flex-col step-enter">
            <div className="px-6 sm:px-10 text-center pt-1 sm:pt-2 shrink-0">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{t.step1Title}</h2>
              <p className="text-[8px] sm:text-[9px] font-bold opacity-40 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1 sm:mt-2">{isRtl ? 'اختر الحجم الذي يناسب احتياجك' : 'Choose the size that fits your needs'}</p>
            </div>
            <div className="flex-1 flex items-center min-h-0">
              <div className="flex gap-4 sm:gap-6 overflow-x-auto px-6 sm:px-10 no-scrollbar snap-x snap-mandatory w-full pb-4 sm:pb-8 ios-scroll">
                {packConfigs.map((pack) => (
                  <div key={pack.size} onClick={() => handleSelectPack(pack.size)} className="shrink-0 w-[72vw] max-w-[280px] snap-center">
                    <div className="glass-container overflow-hidden group active:scale-[0.98] transition-all hover:border-[#FF4D4D]/50">
                       <div className="aspect-[3/4] sm:aspect-[4/5] relative">
                          <img src={getPackImage(pack.size)} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" alt={pack.titleAr} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 bg-[#FF4D4D] text-[8px] sm:text-[9px] font-black px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl shadow-lg uppercase">{pack.badge}</div>
                          <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8">
                             <h3 className="text-xl sm:text-2xl font-black">{isRtl ? pack.titleAr : pack.titleEn}</h3>
                             <div className="flex justify-between items-center mt-1.5 sm:mt-2 border-t border-white/10 pt-2 sm:pt-3">
                                <span className="text-[10px] sm:text-xs opacity-60 font-black">{pack.size} {t.cups}</span>
                                <span className="text-xl sm:text-2xl font-black text-[#FF4D4D]">{dynamicPrices[pack.size] || 0} {t.aed}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 1 && packSize && (
          <section className="h-full flex flex-col step-enter px-4 sm:px-6">
            <div className="shrink-0 flex items-center justify-between gap-2 mb-1 sm:mb-2">
              <button onClick={() => { setStep(0); setSelectedColors([]); }} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-[9px] sm:text-xs font-black hover:bg-white/10 hover:border-[#FF4D4D]/30 transition-all active:scale-95">
                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                <span className="bg-[#FF4D4D]/20 text-[#FF4D4D] px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black">{packSize} {t.cups}</span>
              </button>
              <h2 className="text-sm sm:text-lg font-black tracking-tight text-center flex-1">{t.step2Title}</h2>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                <span className="text-[8px] sm:text-[10px] font-black text-[#FF4D4D] tracking-wide">
                  {selectedCount}/{packSize}
                </span>
                <div className="flex gap-0.5">
                  {[...Array(packSize)].map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx < selectedCount ? 'bg-[#FF4D4D] shadow-[0_0_4px_#FF4D4D]' : 'bg-white/10'}`}></div>
                  ))}
                </div>
              </div>
            </div>

            {showRandomHint && (
              <div className="shrink-0 mb-1 flex justify-center">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1 text-[8px] sm:text-[10px] text-amber-200 font-medium">
                  <svg className="w-3 h-3 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>{t.randomHint}</span>
                  <button onClick={() => setShowRandomHint(false)} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex-1 flex items-center justify-center px-2 py-3 sm:p-4 min-h-0 overflow-y-auto ios-scroll">
               <div className={`grid w-full max-w-lg gap-3 sm:gap-4 ${packSize === 2 ? 'grid-cols-2 max-w-xs' : packSize === 4 ? 'grid-cols-2 max-w-md' : 'grid-cols-3 max-w-lg'}`}>
                  {[...Array(packSize)].map((_, i) => {
                    const colorCode = selectedList[i];
                    const colorInv = inventory.find(inv => inv.colorCode === colorCode);
                    return (
                      <div key={i} onClick={() => colorCode && setInspectColor(colorCode)} className={`relative flex flex-col items-center gap-2 transition-all group ${colorCode ? 'cursor-pointer' : ''}`}>
                        <div className={`w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden transition-all border-2 shadow-xl ${colorCode ? 'border-[#FF4D4D] animate-scale-up shadow-[#FF4D4D]/10' : 'border-dashed border-white/15 opacity-20'}`}>
                          {colorInv ? (
                            <>
                              <img src={getColorImage(colorInv.colorCode)} className="w-full h-full object-cover" alt={isRtl ? colorInv.nameAr : colorInv.nameEn} />
                              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-black/30 opacity-0 group-hover:opacity-100 active:opacity-100 flex items-center justify-center transition-opacity">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                              <div className="text-3xl sm:text-4xl animate-pulse opacity-20">☕</div>
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] sm:text-sm font-bold text-center truncate w-full ${colorInv ? 'opacity-70' : 'opacity-20'}`}>{colorInv ? (isRtl ? colorInv.nameAr : colorInv.nameEn) : (isRtl ? 'فارغ' : 'Empty')}</span>
                      </div>
                    );
                  })}
               </div>
            </div>

            <div className="shrink-0 glass-container !rounded-b-none p-4 sm:p-8 pb-safe border-t-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
               <div className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-4 sm:pb-8 ios-scroll px-1 mt-4">
                  {inventory.map(color => {
                    const qty = selectedList.filter(c => c === color.colorCode).length;
                    const isOutOfStock = color.stock <= qty;
                    const hasGallery = getGalleryImages(color.colorCode).length > 0 || getColorImage(color.colorCode);
                    
                    return (
                      <div key={color.colorCode} className="relative shrink-0 w-16 sm:w-20 mt-4">
                        <button disabled={isOutOfStock} onClick={() => setInspectColor(color.colorCode)} className={`w-16 sm:w-20 flex flex-col items-center gap-1.5 sm:gap-2 transition-all active:scale-90 ${qty > 0 ? '' : 'opacity-40'} ${isOutOfStock ? 'grayscale opacity-10 cursor-not-allowed' : ''}`}>
                          <div className={`w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl border-2 overflow-hidden transition-all shadow-lg relative ${qty > 0 ? 'border-[#FF4D4D] shadow-[#FF4D4D]/20 scale-105' : 'border-white/10'}`}>
                             <img src={getColorImage(color.colorCode)} className="w-full h-full object-cover" alt={color.nameEn} />
                             {hasGallery && (
                               <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-black/50 backdrop-blur-sm rounded-md flex items-center justify-center">
                                 <svg className="w-2.5 h-2.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                               </div>
                             )}
                          </div>
                          <span className="text-[8px] sm:text-[10px] font-bold truncate w-full text-center opacity-70">{isRtl ? color.nameAr : color.nameEn}</span>
                          {qty > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#FF4D4D] text-[9px] sm:text-[10px] font-black w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-black/30">{qty}</span>}
                        </button>
                      </div>
                    );
                  })}
               </div>
               <div className="flex items-center justify-between gap-4 sm:gap-6">
                  <div className="text-start">
                     <span className="text-[8px] sm:text-[9px] font-black opacity-40 block uppercase tracking-[0.15em] sm:tracking-[0.2em]">{t.total}</span>
                     <span className="text-2xl sm:text-3xl font-black text-[#FF4D4D]">{dynamicPrices[packSize!] || 0} <span className="text-[10px] sm:text-xs opacity-60 text-white font-bold">{t.aed}</span></span>
                  </div>
                  <button disabled={selectedCount < packSize} onClick={() => setStep(2)} className="flex-1 bg-white text-black font-black py-3.5 sm:py-5 rounded-2xl sm:rounded-[2rem] shadow-2xl disabled:opacity-10 active:scale-[0.97] transition-all hover:bg-gray-100 text-sm sm:text-base">
                    {t.confirm}
                  </button>
               </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="h-full min-h-0 flex flex-col step-enter overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col justify-center px-4 sm:px-8 py-3 sm:py-6 pb-safe">
              <button onClick={() => setStep(1)} className={`flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[9px] sm:text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 mb-2 sm:mb-4 self-start shrink-0 ${isRtl ? 'flex-row-reverse self-end' : ''}`}>
                <svg className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isRtl ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                {t.back}
              </button>
              <h2 className="text-lg sm:text-3xl font-black mb-2 sm:mb-6 text-center tracking-tight shrink-0">{t.step3Title}</h2>
              <form onSubmit={handleConfirmOrder} className="space-y-1.5 sm:space-y-3 w-full max-w-sm mx-auto flex-1 min-h-0 flex flex-col justify-center">
                 <div className="space-y-1.5 sm:space-y-2">
                    <CompactInput compact placeholder={t.fullName} value={customer.name} onChange={v => setCustomer({...customer, name: v})} />
                    <CompactInput compact placeholder={t.mobile} value={customer.mobile} onChange={v => setCustomer({...customer, mobile: v})} />
                    <CompactInput compact placeholder={t.city} value={customer.city} onChange={v => setCustomer({...customer, city: v})} />
                    <CompactInput compact placeholder={t.address} value={customer.address} onChange={v => setCustomer({...customer, address: v})} />
                 </div>
                 <div className="flex gap-2 sm:gap-3 mt-1.5 sm:mt-3">
                    <button type="button" onClick={() => setCustomer({...customer, preferredTime: 'Morning'})} className={`flex-1 p-2 sm:p-4 rounded-lg sm:rounded-2xl glass-container text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${customer.preferredTime === 'Morning' ? 'bg-white text-black border-white' : 'opacity-40 hover:opacity-60'}`}>☀️ {t.morning}</button>
                    <button type="button" onClick={() => setCustomer({...customer, preferredTime: 'Evening'})} className={`flex-1 p-2 sm:p-4 rounded-lg sm:rounded-2xl glass-container text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${customer.preferredTime === 'Evening' ? 'bg-white text-black border-white' : 'opacity-40 hover:opacity-60'}`}>🌙 {t.evening}</button>
                 </div>
                 <label className="flex items-center gap-2 sm:gap-3.5 p-2 sm:p-4 glass-container cursor-pointer mt-1 sm:mt-2 hover:bg-white/[0.07] transition-all shrink-0">
                    <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="w-4 h-4 sm:w-5 sm:h-5 rounded accent-[#FF4D4D] shrink-0" />
                    <span className="text-[8px] sm:text-[10px] font-bold opacity-60">{t.agree}</span>
                 </label>
                 <button type="submit" disabled={loading} className="w-full bg-[#FF4D4D] py-3 sm:py-5 rounded-xl sm:rounded-[2rem] font-black text-base sm:text-xl shadow-2xl btn-pulse disabled:opacity-50 transition-all active:scale-[0.98] shrink-0">
                    {loading ? <div className="w-5 h-5 sm:w-7 sm:h-7 border-[3px] border-white/20 border-t-white rounded-full animate-spin mx-auto"></div> : t.confirm}
                 </button>
              </form>
            </div>
          </section>
        )}
      </main>

      {inspectColor && (() => {
        const colorInv = inventory.find(i => i.colorCode === inspectColor);
        const galleryRaw = getGalleryImages(inspectColor);
        const mainImg = getColorImage(inspectColor);
        const gallery = galleryRaw.length > 0 ? galleryRaw : mainImg ? [mainImg] : [];
        const currentIdx = activeImgIndex % Math.max(gallery.length, 1);
        const inspectQty = selectedList.filter(c => c === inspectColor).length;
        return (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col animate-scale-up" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }} onClick={() => { setInspectColor(null); setActiveImgIndex(0); }}>
             <div className="flex-1 flex flex-col w-full max-w-lg mx-auto min-h-0" onClick={e => e.stopPropagation()}>
                <div className="shrink-0 flex items-center justify-between px-4 pb-2 sm:px-6" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}>
                  <h3 className="text-base sm:text-xl font-black">{isRtl ? colorInv?.nameAr : colorInv?.nameEn}</h3>
                  <button onClick={() => { setInspectColor(null); setActiveImgIndex(0); }} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
                    <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                {gallery.length > 1 && (
                  <div className="shrink-0 flex gap-1.5 px-4 sm:px-6 mb-2">
                    {gallery.map((_: any, idx: number) => (
                      <button key={idx} onClick={() => setActiveImgIndex(idx)} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden cursor-pointer">
                        <div className={`h-full rounded-full transition-all duration-300 ${idx === currentIdx ? 'w-full bg-[#FF4D4D]' : idx < currentIdx ? 'w-full bg-white/30' : 'w-0'}`}></div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1 min-h-0 relative mx-4 sm:mx-6 rounded-2xl sm:rounded-3xl overflow-hidden bg-black/30 border border-white/5"
                  onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
                  onTouchEnd={(e) => {
                    const startX = (e.currentTarget as any)._touchX;
                    if (startX === undefined) return;
                    const diff = e.changedTouches[0].clientX - startX;
                    if (Math.abs(diff) > 50 && gallery.length > 1) {
                      if (diff < 0) setActiveImgIndex(prev => (prev + 1) % gallery.length);
                      else setActiveImgIndex(prev => (prev - 1 + gallery.length) % gallery.length);
                    }
                  }}
                >
                  {gallery.length > 0 ? gallery.map((img: string, idx: number) => (
                    <img key={img} src={img} className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${idx === currentIdx ? 'opacity-100' : 'opacity-0'}`} alt={`Preview ${idx + 1}`} />
                  )) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-5xl opacity-20">☕</div>
                    </div>
                  )}
                  {gallery.length > 1 && (
                    <>
                      <button onClick={() => setActiveImgIndex(prev => (prev - 1 + gallery.length) % gallery.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 z-20 active:scale-90">
                        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                      </button>
                      <button onClick={() => setActiveImgIndex(prev => (prev + 1) % gallery.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 z-20 active:scale-90">
                        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                      </button>
                    </>
                  )}
                  {gallery.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 text-center z-20">
                      <span className="text-[9px] font-bold bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-white/60">{currentIdx + 1} / {gallery.length}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 px-4 sm:px-6 pt-3 pb-6 sm:pb-8" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
                   {gallery.length > 1 && (
                     <p className="text-[9px] sm:text-[10px] font-bold opacity-30 text-center mb-2">{isRtl ? 'اسحب أو اضغط الأسهم لاستعراض الصور' : 'Swipe or tap arrows to browse'}</p>
                   )}
                   <div className="flex gap-2.5">
                      {inspectQty > 0 && (
                        <button onClick={() => { handleRemoveColor(inspectColor); }} className="w-14 bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl transition-transform active:scale-95 text-sm flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"></path></svg>
                        </button>
                      )}
                      <button onClick={() => { handleAddColor(inspectColor); }} className="flex-1 bg-[#FF4D4D] text-white font-black py-4 rounded-2xl shadow-2xl transition-transform active:scale-95 disabled:opacity-20 text-base flex items-center justify-center gap-2" disabled={selectedCount >= (packSize || 0) && inspectQty === 0}>
                        {inspectQty > 0 ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                            <span>{isRtl ? `${inspectQty} في الطقم` : `${inspectQty} in set`}</span>
                          </>
                        ) : (
                          <span>{isRtl ? 'إضافة للطقم' : 'Add to Set'}</span>
                        )}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        );
      })()}

      <footer className="shrink-0 bg-[#FF4D4D] text-white py-2 sm:py-2.5 text-[7px] sm:text-[8px] font-black text-center uppercase tracking-[0.2em] sm:tracking-[0.3em] z-[60] shadow-[0_-10px_30px_rgba(255,77,77,0.2)]">
        {t.ticker}
      </footer>
    </div>
  );
};

const CompactInput: React.FC<{ placeholder: string; value: string; onChange: (v: string) => void; compact?: boolean }> = ({ placeholder, value, onChange, compact }) => (
  <input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl font-bold outline-none focus:border-[#FF4D4D] focus:bg-white/[0.07] transition-all placeholder:text-white/20 shadow-inner ${compact ? 'px-3 sm:px-4 py-2 sm:py-2.5 text-xs' : 'px-4 sm:px-6 py-3.5 sm:py-4 text-sm'}`} />
);

const AdminPage: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(!!sessionStorage.getItem('adminToken'));

  const handleLogout = async () => {
    await api.adminLogout();
    setAuthenticated(false);
  };

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  }

  return <AdminDashboard onBack={handleLogout} />;
};

const Root: React.FC = () => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (path === '/admin' || path.startsWith('/admin/')) {
    return <AdminPage />;
  }

  return <App />;
};

export default Root;
