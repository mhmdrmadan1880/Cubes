
-- 1. Inventory Items Table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    color_code VARCHAR(20) UNIQUE NOT NULL,
    name_ar VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0), -- قيد حماية على مستوى قاعدة البيانات
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(15) UNIQUE NOT NULL,
    language VARCHAR(2) NOT NULL, -- 'ar' or 'en'
    pack_size INT NOT NULL,
    total_price INT NOT NULL,
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    customer_name VARCHAR(100) NOT NULL,
    customer_mobile VARCHAR(20) NOT NULL,
    customer_city VARCHAR(50) NOT NULL,
    customer_address TEXT NOT NULL,
    preferred_time VARCHAR(20) NOT NULL, -- 'Morning' or 'Evening'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    color_code VARCHAR(20) NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Inventory Seed
INSERT INTO inventory_items (color_code, name_ar, name_en, stock) VALUES
('BROWN', 'رمل البحر', 'Sea Sand', 32),
('BLUE', 'سماء دبي', 'Dubai Sky', 35),
('PINK', 'ورد جوري', 'Damask Rose', 46),
('BLACK', 'ليل عميق', 'Deep Night', 9),
('GREEN', 'واحة خضراء', 'Green Oasis', 37),
('BLUE_DOTS', 'غمام أبيض', 'White Clouds', 35),
('BROWN_DOTS', 'أرض طيبة', 'Good Earth', 34);
