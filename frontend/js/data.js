/**
 * Mock Data for Restaurant System
 * Gia Vi Viet - Gourmet Restaurant
 */

const INITIAL_CATEGORIES = [
  'Tất cả',
  'Món Khai Vị',
  'Món Bò & Bê',
  'Hải Sản Tươi Sống',
  'Lẩu Đặc Biệt',
  'Đồ Uống & Rượu',
  'Tráng Miệng'
];

const INITIAL_DISHES = [
  {
    id: 'dish-1',
    sku: 'BO-FUJI-01',
    name: 'Bò Fuji Nướng Đá Núi Lửa',
    category: 'Món Bò & Bê',
    price: 285000,
    cost: 115000,
    unit: 'Phần',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    status: 'available', // 'available' | 'out_of_stock'
    bestSeller: true,
    badge: 'Best Seller',
    description: 'Bò Fuji vân mỡ mềm tan, nướng trực tiếp trên phiến đá núi lửa nóng 300 độ C kèm sốt tiêu đen đặc biệt.',
    salesCount: 1240,
    vat: 8
  },
  {
    id: 'dish-2',
    sku: 'GOI-CUHU-02',
    name: 'Gỏi Củ Hũ Dừa Tôm Thịt',
    category: 'Món Khai Vị',
    price: 145000,
    cost: 55000,
    unit: 'Đĩa',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    status: 'available',
    bestSeller: false,
    badge: 'Món mới',
    description: 'Củ hũ dừa Bến Tre giòn ngọt tự nhiên, tôm sú tươi bóc nõn, thịt ba chỉ luộc và nước mắm chua ngọt Nam Bộ.',
    salesCount: 680,
    vat: 8
  },
  {
    id: 'dish-3',
    sku: 'LAU-TOMYUM-03',
    name: 'Lẩu Thái Tom Yum Hải Sản',
    category: 'Lẩu Đặc Biệt',
    price: 390000,
    cost: 160000,
    unit: 'Nồi',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
    status: 'available',
    bestSeller: true,
    badge: 'Cay nhẹ',
    description: 'Nước lẩu cốt dừa lá chanh đậm vị chua cay, tôm càng xanh, mực ống, ngao hai cùi và nấm tươi tổng hợp.',
    salesCount: 890,
    vat: 8
  },
  {
    id: 'dish-4',
    sku: 'CA-HOI-04',
    name: 'Cá Hồi Nướng Sốt Teriyaki',
    category: 'Hải Sản Tươi Sống',
    price: 245000,
    cost: 110000,
    unit: 'Phần',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop&q=80',
    status: 'available',
    bestSeller: false,
    badge: '',
    description: 'Phi lê cá hồi Na Uy áp chảo da giòn, sốt teriyaki Nhật Bản sánh mịn dùng kèm măng tây xào bơ tỏi.',
    salesCount: 430,
    vat: 8
  },
  {
    id: 'dish-5',
    sku: 'TRA-DAO-05',
    name: 'Trà Đào Cam Sả Tươi',
    category: 'Đồ Uống & Rượu',
    price: 45000,
    cost: 12000,
    unit: 'Ly',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    status: 'available',
    bestSeller: true,
    badge: 'Best Seller',
    description: 'Trà đen Ceylon ủ lạnh thơm nồng, nước cốt cam tươi, đào ngâm giòn ngọt và hương sả thoang thoảng.',
    salesCount: 2150,
    vat: 8
  },
  {
    id: 'dish-6',
    sku: 'BIA-CRAFT-06',
    name: 'Bia Craft IPA Thủ Công',
    category: 'Đồ Uống & Rượu',
    price: 68000,
    cost: 28000,
    unit: 'Ly',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&auto=format&fit=crop&q=80',
    status: 'available',
    bestSeller: false,
    badge: '',
    description: 'Bia thủ công phong cách IPA nấu từ hoa bia hoa quả nhiệt đới, hậu vị thơm đắng nhẹ và bọt sánh mịn.',
    salesCount: 760,
    vat: 8
  },
  {
    id: 'dish-7',
    sku: 'CUA-CAMAU-07',
    name: 'Cua Cà Mau Sốt Trứng Muối',
    category: 'Hải Sản Tươi Sống',
    price: 420000,
    cost: 210000,
    unit: 'Con',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80',
    status: 'available',
    bestSeller: true,
    badge: 'Đặc sản',
    description: 'Cua thịt Cà Mau chắc nịch, rang sốt trứng muối bùi béo đậm đà, ăn kèm bánh mì bơ tỏi giòn rụm.',
    salesCount: 520,
    vat: 8
  },
  {
    id: 'dish-8',
    sku: 'CHE-SEN-08',
    name: 'Chè Hạt Sen Long Nhãn',
    category: 'Tráng Miệng',
    price: 40000,
    cost: 14000,
    unit: 'Bát',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&auto=format&fit=crop&q=80',
    status: 'out_of_stock', // Món mẫu hết hàng để test UX
    bestSeller: false,
    badge: 'Tạm hết',
    description: 'Hạt sen Huế ninh bở bùi, lồng trong cùi nhãn Hưng Yên mọng nước, chan nước đường phèn hoa bưởi thanh khiết.',
    salesCount: 610,
    vat: 8
  }
];

const INITIAL_ORDER_ITEMS = [
  {
    dishId: 'dish-1',
    name: 'Bò Fuji Nướng Đá Núi Lửa',
    category: 'Món Bò & Bê',
    station: 'Bếp Nóng',
    price: 285000,
    quantity: 2,
    note: 'Chín vừa, sốt tiêu đen riêng',
    status: 'COOKING', // 'QUEUED' | 'COOKING' | 'READY' | 'SERVED'
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
  },
  {
    dishId: 'dish-2',
    name: 'Gỏi Củ Hũ Dừa Tôm Thịt',
    category: 'Món Khai Vị',
    station: 'Bếp Lạnh',
    price: 145000,
    quantity: 1,
    note: 'Không bỏ rau răm, ít ớt',
    status: 'READY',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'
  },
  {
    dishId: 'dish-5',
    name: 'Trà Đào Cam Sả Tươi',
    category: 'Đồ Uống & Rượu',
    station: 'Quầy Bar',
    price: 45000,
    quantity: 4,
    note: '70% đường, đá riêng',
    status: 'COOKING',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80'
  }
];

const MOCK_TABLES = [
  {
    id: '01',
    number: 'Bàn 01',
    area: 'Tầng 1 - Cửa Sổ',
    capacity: 2,
    status: 'VACANT',
    guests: 0,
    checkIn: '',
    server: 'Trần Minh Tâm',
    orderCode: '#ORD-8825',
    items: []
  },
  {
    id: '02',
    number: 'Bàn 02',
    area: 'Tầng 1 - Góc Trong',
    capacity: 4,
    status: 'OCCUPIED',
    guests: 2,
    checkIn: '12:21',
    server: 'Lê Thanh Mai',
    orderCode: '#ORD-8822',
    items: [
      {
        dishId: 'dish-3',
        name: 'Lẩu Thái Tom Yum Hải Sản',
        category: 'Lẩu Đặc Biệt',
        station: 'Bếp Nóng',
        price: 390000,
        quantity: 1,
        note: 'Cay ít, thêm ngao sạch',
        status: 'QUEUED',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: '05',
    number: 'Bàn 05',
    area: 'Tầng 1 - Sảnh Chính',
    capacity: 4,
    status: 'OCCUPIED',
    guests: 4,
    checkIn: '12:15',
    server: 'Trần Minh Tâm',
    orderCode: '#ORD-8821',
    items: [...INITIAL_ORDER_ITEMS]
  },
  {
    id: 'VIP-1',
    number: 'Bàn VIP-1',
    area: 'Phòng VIP Hoàng Gia',
    capacity: 8,
    status: 'OCCUPIED',
    guests: 6,
    checkIn: '12:05',
    server: 'Phạm Đức Anh',
    orderCode: '#ORD-8819',
    items: [
      {
        dishId: 'dish-7',
        name: 'Cua Cà Mau Sốt Trứng Muối',
        category: 'Hải Sản Tươi Sống',
        station: 'Bếp Nóng',
        price: 420000,
        quantity: 1,
        note: 'Làm thật cay, ăn kèm bánh mì giòn',
        status: 'COOKING',
        image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80'
      },
      {
        dishId: 'dish-4',
        name: 'Cá Hồi Nướng Sốt Teriyaki',
        category: 'Hải Sản Tươi Sống',
        station: 'Bếp Nóng',
        price: 245000,
        quantity: 2,
        note: 'Áp chảo kỹ da',
        status: 'READY',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: '10',
    number: 'Bàn 10',
    area: 'Sân Vườn View Hồ',
    capacity: 6,
    status: 'RESERVED',
    guests: 0,
    checkIn: '18:30 (Khách đặt)',
    server: 'Chưa chỉ định',
    orderCode: '#RES-104',
    items: []
  }
];

const MOCK_TABLE = MOCK_TABLES[2]; // Default to Table 05

const INITIAL_KDS_TICKETS = [
  {
    id: 'ticket-1',
    orderCode: '#ORD-8821',
    tableId: '05',
    tableName: 'Bàn 05',
    area: 'Tầng 1 - Sảnh Chính',
    server: 'Trần Minh Tâm',
    guests: 4,
    orderTime: '12:15',
    elapsedMinutes: 8,
    isOverdue: false,
    items: [
      {
        id: 't1-item-1',
        dishId: 'dish-1',
        name: 'Bò Fuji Nướng Đá Núi Lửa',
        quantity: 2,
        station: 'Bếp Nóng',
        note: 'Chín vừa, sốt tiêu đen riêng',
        status: 'COOKING'
      },
      {
        id: 't1-item-2',
        dishId: 'dish-2',
        name: 'Gỏi Củ Hũ Dừa Tôm Thịt',
        quantity: 1,
        station: 'Bếp Lạnh',
        note: 'Không bỏ rau răm, ít ớt',
        status: 'READY'
      },
      {
        id: 't1-item-3',
        dishId: 'dish-5',
        name: 'Trà Đào Cam Sả Tươi',
        quantity: 4,
        station: 'Quầy Bar',
        note: '70% đường, đá riêng',
        status: 'COOKING'
      }
    ]
  },
  {
    id: 'ticket-2',
    orderCode: '#ORD-8822',
    tableId: '02',
    tableName: 'Bàn 02',
    area: 'Tầng 1 - Góc Trong',
    server: 'Lê Thanh Mai',
    guests: 2,
    orderTime: '12:21',
    elapsedMinutes: 2,
    isOverdue: false,
    items: [
      {
        id: 't2-item-1',
        dishId: 'dish-3',
        name: 'Lẩu Thái Tom Yum Hải Sản',
        quantity: 1,
        station: 'Bếp Nóng',
        note: 'Cay ít, thêm ngao sạch',
        status: 'QUEUED'
      }
    ]
  },
  {
    id: 'ticket-3',
    orderCode: '#ORD-8819',
    tableId: 'VIP-1',
    tableName: 'Bàn VIP-1',
    area: 'Phòng VIP Hoàng Gia',
    server: 'Phạm Đức Anh',
    guests: 6,
    orderTime: '12:05',
    elapsedMinutes: 18,
    isOverdue: true,
    items: [
      {
        id: 't3-item-1',
        dishId: 'dish-7',
        name: 'Cua Cà Mau Sốt Trứng Muối',
        quantity: 1,
        station: 'Bếp Nóng',
        note: 'Làm thật cay, ăn kèm bánh mì giòn',
        status: 'COOKING'
      },
      {
        id: 't3-item-2',
        dishId: 'dish-4',
        name: 'Cá Hồi Nướng Sốt Teriyaki',
        quantity: 2,
        station: 'Bếp Nóng',
        note: 'Áp chảo kỹ da',
        status: 'READY'
      }
    ]
  }
];

const MOCK_CUSTOMERS = [
  {
    phone: '0988123456',
    name: 'Nguyễn Thị Mai',
    tier: 'VIP Gold',
    points: 3200,
    maxRedeemPoints: 50, // 50 điểm = 50.000 VNĐ
    discountRate: 10
  },
  {
    phone: '0912345678',
    name: 'Trần Văn Hoàng',
    tier: 'Thành viên Bạc',
    points: 850,
    maxRedeemPoints: 20,
    discountRate: 5
  }
];

const MOCK_VOUCHERS = [
  { code: 'VIPGOLD10', label: 'Voucher VIPGOLD10 (-10%)', discountPercent: 10, discountAmount: 0 },
  { code: 'GIAM20K', label: 'Giảm 20.000đ', discountPercent: 0, discountAmount: 20000 },
  { code: 'COMBO_LUNCH', label: 'Combo Trưa (-5%)', discountPercent: 5, discountAmount: 0 }
];

const QUICK_NOTES = [
  'Ít ngọt',
  'Không cay',
  'Làm nóng',
  'Ưu tiên lên trước',
  'Ít đá',
  'Không bột ngọt'
];

const MOCK_INVENTORY = [
  { id: 'inv-1', sku: 'NL-BO-01', name: 'Thịt Bò Fuji Nhật Bản', unit: 'kg', stock: 14.5, minStock: 5.0, status: 'NORMAL', cost: 350000 },
  { id: 'inv-2', sku: 'NL-CUA-02', name: 'Cua Cà Mau Tươi Sống', unit: 'kg', stock: 8.2, minStock: 3.0, status: 'NORMAL', cost: 280000 },
  { id: 'inv-3', sku: 'NL-TRA-03', name: 'Trà Đen Ceylon Hảo Hạng', unit: 'hộp', stock: 12.0, minStock: 2.0, status: 'NORMAL', cost: 85000 },
  { id: 'inv-4', sku: 'NL-SEN-04', name: 'Hạt Sen Huế & Long Nhãn', unit: 'kg', stock: 0.3, minStock: 2.0, status: 'LOW_STOCK', cost: 120000 },
  { id: 'inv-5', sku: 'NL-DUA-05', name: 'Củ Hũ Dừa Bến Tre', unit: 'kg', stock: 6.0, minStock: 2.0, status: 'NORMAL', cost: 45000 },
  { id: 'inv-6', sku: 'NL-BIA-06', name: 'Hoa Bia IPA Nấu Bia Craft', unit: 'gói', stock: 25.0, minStock: 5.0, status: 'NORMAL', cost: 110000 }
];

const MOCK_STAFF = [
  { id: 'usr-1', username: 'namlh', name: 'Lê Hoàng Nam', role: 'MANAGER', roleLabel: 'Quản Lý Trưởng', phone: '0901234567', status: 'ACTIVE', avatar: 'LN' },
  { id: 'usr-2', username: 'tamtnt', name: 'Trần Minh Tâm', role: 'SERVER', roleLabel: 'Phục Vụ Bàn (Sảnh)', phone: '0908765432', status: 'ACTIVE', avatar: 'TT' },
  { id: 'usr-3', username: 'tuanva', name: 'Nguyễn Văn Tuấn', role: 'KITCHEN', roleLabel: 'Bếp Trưởng KDS', phone: '0912987654', status: 'ACTIVE', avatar: 'NT' },
  { id: 'usr-4', username: 'mailt', name: 'Lê Thanh Mai', role: 'CASHIER', roleLabel: 'Thu Ngân Quầy', phone: '0933221100', status: 'ACTIVE', avatar: 'LM' },
  { id: 'usr-5', username: 'anhpd', name: 'Phạm Đức Anh', role: 'SERVER', roleLabel: 'Phục Vụ VIP Room', phone: '0944556677', status: 'ACTIVE', avatar: 'ĐA' }
];

const MOCK_REPORTS = {
  todayRevenue: 18650000,
  completedOrders: 32,
  activeTables: 3,
  averageCheck: 582000,
  paymentBreakdown: {
    vietqr: { count: 18, amount: 10250000, percent: 55 },
    cash: { count: 10, amount: 5600000, percent: 30 },
    card: { count: 4, amount: 2800000, percent: 15 }
  },
  topDishes: [
    { name: 'Bò Fuji Nướng Đá Núi Lửa', sold: 48, revenue: 13680000 },
    { name: 'Trà Đào Cam Sả Tươi', sold: 82, revenue: 3690000 },
    { name: 'Lẩu Thái Tom Yum Hải Sản', sold: 24, revenue: 9360000 }
  ]
};
