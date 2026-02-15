
import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerObjectStorageRoutes } from './replit_integrations/object_storage/index.js';

dotenv.config();

// Hardcoded admin credentials (username: admin, password: qwe-12345)
const ADMIN_USERS = [{ username: 'admin', password: 'qwe-12345' }];
const adminTokens = new Set<string>();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json() as any);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not defined.");
  process.exit(1);
}

const pool = new Pool({ 
  connectionString: DATABASE_URL,
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        color_code VARCHAR(20) UNIQUE NOT NULL,
        name_ar VARCHAR(50) NOT NULL,
        name_en VARCHAR(50) NOT NULL,
        hex VARCHAR(10) NOT NULL DEFAULT '#888888',
        sort_order INT NOT NULL DEFAULT 0,
        stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pack_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        size INT UNIQUE NOT NULL,
        title_ar VARCHAR(100) NOT NULL,
        title_en VARCHAR(100) NOT NULL,
        desc_ar TEXT NOT NULL DEFAULT '',
        desc_en TEXT NOT NULL DEFAULT '',
        badge VARCHAR(50) NOT NULL DEFAULT '',
        sort_order INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_code VARCHAR(15) UNIQUE NOT NULL,
        language VARCHAR(2) NOT NULL,
        pack_size INT NOT NULL,
        total_price INT NOT NULL,
        status VARCHAR(20) DEFAULT 'CONFIRMED',
        customer_name VARCHAR(100) NOT NULL,
        customer_mobile VARCHAR(20) NOT NULL,
        customer_city VARCHAR(50) NOT NULL,
        customer_address TEXT NOT NULL,
        preferred_time VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        color_code VARCHAR(20) NOT NULL,
        qty INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_settings (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS image_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(20) NOT NULL,
        ref_key VARCHAR(30) NOT NULL,
        image_url TEXT NOT NULL,
        sort_order INT DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, ref_key, sort_order)
      );
    `);

    // Add hex and sort_order columns if they don't exist (safe migration)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS hex VARCHAR(10) NOT NULL DEFAULT '#888888';
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    const checkSettings = await client.query('SELECT COUNT(*) FROM admin_settings');
    if (parseInt(checkSettings.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO admin_settings (key, value) VALUES
        ('pack_prices', '{"2": 50, "3": 65, "4": 80}'),
        ('delivery_fee', '0'),
        ('min_order', '1'),
        ('whatsapp_number', '"971500000000"'),
        ('store_active', 'true')
      `);
      console.log('✅ Admin settings seeded.');
    }

    const checkInv = await client.query('SELECT COUNT(*) FROM inventory_items');
    if (parseInt(checkInv.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO inventory_items (color_code, name_ar, name_en, hex, sort_order, stock) VALUES
        ('BROWN', 'رمل البحر', 'Sea Sand', '#D2B48C', 0, 32),
        ('BLUE', 'سماء دبي', 'Dubai Sky', '#4A90E2', 1, 35),
        ('PINK', 'ورد جوري', 'Damask Rose', '#F4C2C2', 2, 46),
        ('BLACK', 'ليل عميق', 'Deep Night', '#2C2C2C', 3, 9),
        ('GREEN', 'واحة خضراء', 'Green Oasis', '#4F7942', 4, 37),
        ('BLUE_DOTS', 'غمام أبيض', 'White Clouds', '#F5F5DC', 5, 35),
        ('BROWN_DOTS', 'أرض طيبة', 'Good Earth', '#8B4513', 6, 34);
      `);
      console.log('✅ Inventory seeded successfully.');
    } else {
      // Update existing rows with hex if they have the default
      await client.query(`
        UPDATE inventory_items SET hex = CASE color_code
          WHEN 'BROWN' THEN '#D2B48C'
          WHEN 'BLUE' THEN '#4A90E2'
          WHEN 'PINK' THEN '#F4C2C2'
          WHEN 'BLACK' THEN '#2C2C2C'
          WHEN 'GREEN' THEN '#4F7942'
          WHEN 'BLUE_DOTS' THEN '#F5F5DC'
          WHEN 'BROWN_DOTS' THEN '#8B4513'
          ELSE hex
        END
        WHERE hex = '#888888';
      `);
    }

    const checkPacks = await client.query('SELECT COUNT(*) FROM pack_configs');
    if (parseInt(checkPacks.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO pack_configs (size, title_ar, title_en, desc_ar, desc_en, badge, sort_order) VALUES
        (2, 'مزاج الهدوء ☕', 'Serenity Duo', 'مثالي للحظاتك الخاصة أو كهدية رقيقة.', 'Perfect for your private moments or a gentle gift.', 'لذيذ', 0),
        (3, 'طاقة المكتب ✨', 'Office Energy', 'لأيام العمل الطويلة، طقم يبعث فيك الحيوية.', 'For long workdays, a set that boosts your energy.', 'الأكثر حيوية 🔥', 1),
        (4, 'الضيافة الملكية 👑', 'Royal Hosting', 'كن المضيف الأروع، ألوان تخطف الأنظار.', 'Be the coolest host, colors that catch eyes.', 'قيمة مذهلة 💎', 2);
      `);
      console.log('✅ Pack configs seeded successfully.');
    }
  } catch (err) {
    console.error('❌ Database Init Error:', err);
  } finally {
    client.release();
  }
}

initDb();

app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT color_code as "colorCode", name_ar as "nameAr", name_en as "nameEn", hex, sort_order as "sortOrder", stock, updated_at as "updatedAt" FROM inventory_items ORDER BY sort_order, color_code');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/packs', async (req, res) => {
  try {
    const result = await pool.query('SELECT size, title_ar as "titleAr", title_en as "titleEn", desc_ar as "descAr", desc_en as "descEn", badge, sort_order as "sortOrder" FROM pack_configs ORDER BY sort_order, size');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pack configs' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (ADMIN_USERS.some(u => u.username === username && u.password === password)) {
    const token = crypto.randomBytes(32).toString('hex');
    adminTokens.add(token);
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) adminTokens.delete(token);
  res.json({ success: true });
});

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use('/api/admin', (req, res, next) => {
  if (req.path === '/login' || req.path === '/logout') return next();
  requireAdmin(req, res, next);
});

app.put('/api/admin/packs/:size', async (req, res) => {
  const size = parseInt(req.params.size);
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  const mapping: Record<string, string> = { titleAr: 'title_ar', titleEn: 'title_en', descAr: 'desc_ar', descEn: 'desc_en', badge: 'badge' };
  for (const [key, col] of Object.entries(mapping)) {
    if (req.body[key] !== undefined) {
      fields.push(`${col} = $${idx}`);
      values.push(req.body[key]);
      idx++;
    }
  }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  try {
    values.push(size);
    await pool.query(`UPDATE pack_configs SET ${fields.join(', ')}, updated_at = NOW() WHERE size = $${idx}`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pack config' });
  }
});

app.get('/api/activity', async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const activities: string[] = [];
    const orders = await pool.query(`SELECT customer_name, customer_city, pack_size FROM orders ORDER BY created_at DESC LIMIT 3`);
    orders.rows.forEach(o => {
      const name = o.customer_name.split(' ')[0];
      activities.push(lang === 'ar' ? `${name} من ${o.customer_city} طلب طقم ${o.pack_size} قطع! ✨` : `${name} from ${o.customer_city} ordered ${o.pack_size} pieces! ✨`);
    });
    const stock = await pool.query(`SELECT name_ar, name_en, stock FROM inventory_items WHERE stock < 10 LIMIT 2`);
    stock.rows.forEach(s => {
      activities.push(lang === 'ar' ? `بقي ${s.stock} قطع فقط من "${s.name_ar}"! ⚡` : `Only ${s.stock} left of "${s.name_en}"! ⚡`);
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Activity fetch failed' });
  }
});

app.get('/api/settings/public', async (_req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM admin_settings');
    const settings: Record<string, any> = {};
    result.rows.forEach((r: any) => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { language, packSize, items, customer } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const storeActiveRes = await client.query("SELECT value FROM admin_settings WHERE key = 'store_active'");
    const storeActive = storeActiveRes.rows[0]?.value;
    if (storeActive === false || storeActive === 'false') {
      throw new Error(language === 'ar' ? 'المتجر مغلق حالياً' : 'Store is currently closed');
    }

    const pricesRes = await client.query("SELECT value FROM admin_settings WHERE key = 'pack_prices'");
    const packPrices = pricesRes.rows[0]?.value || { "2": 50, "3": 65, "4": 80 };

    const aggregatedItems: Record<string, number> = {};
    items.forEach((item: any) => {
      aggregatedItems[item.colorCode] = (aggregatedItems[item.colorCode] || 0) + item.qty;
    });

    for (const [colorCode, qty] of Object.entries(aggregatedItems)) {
      const check = await client.query(
        'SELECT stock, name_ar, name_en FROM inventory_items WHERE color_code = $1 FOR UPDATE',
        [colorCode]
      );
      
      if (!check.rows[0]) {
        throw new Error(`Color ${colorCode} not found`);
      }
      
      if (check.rows[0].stock < qty) {
        const name = language === 'ar' ? check.rows[0].name_ar : check.rows[0].name_en;
        throw new Error(language === 'ar' ? `عذراً، الكمية المتوفرة من "${name}" غير كافية حالياً.` : `Sorry, insufficient stock for "${name}".`);
      }
    }

    for (const [colorCode, qty] of Object.entries(aggregatedItems)) {
      await client.query(
        'UPDATE inventory_items SET stock = stock - $1, updated_at = NOW() WHERE color_code = $2',
        [qty, colorCode]
      );
    }

    const orderCode = `CUP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const totalPrice = packPrices[String(packSize)] || (packSize === 2 ? 50 : (packSize === 3 ? 65 : 80));
    
    const orderResult = await client.query(
      `INSERT INTO orders 
      (order_code, language, pack_size, total_price, customer_name, customer_mobile, customer_city, customer_address, preferred_time) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [orderCode, language, packSize, totalPrice, customer.name, customer.mobile, customer.city, customer.address, customer.preferredTime]
    );

    const orderId = orderResult.rows[0].id;

    // 5. تسجيل أصناف الطلب
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, color_code, qty) VALUES ($1, $2, $3)',
        [orderId, item.colorCode, item.qty]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ 
      ...orderResult.rows[0], 
      orderCode,
      customer: { name: customer.name, city: customer.city, address: customer.address }
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Admin API
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await pool.query(`
      SELECT o.id, o.order_code, o.language, o.pack_size, o.total_price, o.status,
             o.customer_name, o.customer_mobile, o.customer_city, o.customer_address, o.preferred_time,
             o.created_at,
             (SELECT json_agg(json_build_object('colorCode', oi.color_code, 'qty', oi.qty)) FROM order_items oi WHERE oi.order_id = o.id) as items
      FROM orders o 
      ORDER BY o.created_at DESC
    `);
    const formatted = orders.rows.map((o: any) => ({
      id: o.id,
      orderCode: o.order_code,
      language: o.language,
      packSize: o.pack_size,
      totalPrice: o.total_price,
      status: o.status,
      customer: {
        name: o.customer_name,
        mobile: o.customer_mobile,
        city: o.customer_city,
        address: o.customer_address,
        preferredTime: o.preferred_time
      },
      items: o.items || [],
      createdAt: o.created_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.put('/api/admin/orders/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.put('/api/admin/inventory/:colorCode', async (req, res) => {
  const { colorCode } = req.params;
  const { stock, nameAr, nameEn, hex } = req.body;
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (stock !== undefined) { updates.push(`stock = $${idx++}`); values.push(stock); }
    if (nameAr !== undefined) { updates.push(`name_ar = $${idx++}`); values.push(nameAr); }
    if (nameEn !== undefined) { updates.push(`name_en = $${idx++}`); values.push(nameEn); }
    if (hex !== undefined) { updates.push(`hex = $${idx++}`); values.push(hex); }
    updates.push('updated_at = NOW()');
    values.push(colorCode);
    await pool.query(
      `UPDATE inventory_items SET ${updates.join(', ')} WHERE color_code = $${idx}`,
      values
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

app.get('/api/admin/settings', async (_req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM admin_settings');
    const settings: Record<string, any> = {};
    result.rows.forEach((r: any) => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/admin/settings', async (req: Request, res: Response) => {
  const settings = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(settings)) {
      await client.query(
        `INSERT INTO admin_settings (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
        [key, JSON.stringify(value)]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update settings' });
  } finally {
    client.release();
  }
});

registerObjectStorageRoutes(app);

app.get('/api/images', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM image_assets ORDER BY category, ref_key, sort_order');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

app.put('/api/admin/images', async (req, res) => {
  const { category, ref_key, image_url, sort_order } = req.body;
  if (!category || !ref_key || !image_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await pool.query(
      `INSERT INTO image_assets (category, ref_key, image_url, sort_order, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (category, ref_key, sort_order) DO UPDATE SET image_url = $3, updated_at = NOW()`,
      [category, ref_key, image_url, sort_order || 0]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Image save error:', err);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

app.delete('/api/admin/images/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM image_assets WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath, { maxAge: '1h' }));
app.get('/{*path}', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;
app.listen(Number(PORT), '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
