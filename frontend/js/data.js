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
    price: 285000,
    quantity: 2,
    note: 'Chín vừa, sốt tiêu đen riêng',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
  },
  {
    dishId: 'dish-2',
    name: 'Gỏi Củ Hũ Dừa Tôm Thịt',
    price: 145000,
    quantity: 1,
    note: 'Không bỏ rau răm, ít ớt',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'
  },
  {
    dishId: 'dish-5',
    name: 'Trà Đào Cam Sả Tươi',
    price: 45000,
    quantity: 4,
    note: '70% đường, đá riêng',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80'
  }
];

const MOCK_TABLE = {
  id: '05',
  area: 'Tầng 1 - Sảnh Chính',
  guests: 4,
  checkIn: '12:15',
  server: 'Trần Minh Tâm',
  orderCode: '#ORD-8821'
};

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
