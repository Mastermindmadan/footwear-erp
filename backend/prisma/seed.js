const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Footwear Retail ERP Database...');

  // Clean up existing tables
  await prisma.notification.deleteMany();
  await prisma.capitalRecord.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.salesTarget.deleteMany();
  await prisma.damagedProduct.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rackLocation.deleteMany();
  await prisma.shelf.deleteMany();
  await prisma.rack.deleteMany();
  await prisma.department.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.storeSetting.deleteMany();
  await prisma.user.deleteMany();

  // 1. Store Settings
  await prisma.storeSetting.create({
    data: {
      storeName: 'SoleFit Premium Footwear Store',
      tagline: 'Step into Comfort & Elegance',
      phone: '+91 98450 12345',
      email: 'store@solefitfootwear.com',
      address: 'Plot #42, Commercial Street, Shivajinagar, Bangalore, Karnataka - 560001',
      gstin: '29AABCS1429B1Z8',
      footwearGstThreshold: 1000,
      lowGstPercent: 5,
      highGstPercent: 12,
      currencySymbol: '₹',
    },
  });

  // 2. Users (Management & Sales Executives)
  const passwordHash = await bcrypt.hash('admin123', 10);
  const salesPasswordHash = await bcrypt.hash('sales123', 10);

  const manager = await prisma.user.create({
    data: {
      name: 'Vikram Malhotra',
      email: 'admin@solefit.com',
      passwordHash,
      role: 'MANAGEMENT',
      phone: '+91 98801 11222',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'rajesh@solefit.com',
      passwordHash: salesPasswordHash,
      role: 'SALES_EXECUTIVE',
      phone: '+91 97410 33445',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@solefit.com',
      passwordHash: salesPasswordHash,
      role: 'SALES_EXECUTIVE',
      phone: '+91 98451 55667',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  const sales3 = await prisma.user.create({
    data: {
      name: 'Amit Patel',
      email: 'amit@solefit.com',
      passwordHash: salesPasswordHash,
      role: 'SALES_EXECUTIVE',
      phone: '+91 99002 77889',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 3. Brands
  const brandsData = [
    { name: 'Nike', code: 'NKE' },
    { name: 'Adidas', code: 'ADS' },
    { name: 'Puma', code: 'PMA' },
    { name: 'Bata', code: 'BTA' },
    { name: 'Woodland', code: 'WDL' },
    { name: 'Sparx', code: 'SPX' },
    { name: 'Skechers', code: 'SKC' },
    { name: 'Red Tape', code: 'RDT' },
    { name: 'Campus', code: 'CMP' },
    { name: 'Clarks', code: 'CLK' },
  ];

  const brands = {};
  for (const b of brandsData) {
    brands[b.code] = await prisma.brand.create({ data: b });
  }

  // 4. Categories
  const categoriesData = [
    { name: 'Running Shoes', code: 'RUN', gender: 'UNISEX' },
    { name: 'Casual Sneakers', code: 'SNK', gender: 'UNISEX' },
    { name: 'Formal Leather Shoes', code: 'FRM', gender: 'MEN' },
    { name: 'Loafers & Slip-ons', code: 'LFR', gender: 'MEN' },
    { name: 'Sports Sandals & Floaters', code: 'SND', gender: 'UNISEX' },
    { name: 'Hiking & Rugged Boots', code: 'BOT', gender: 'MEN' },
    { name: 'Women Walking & Gym', code: 'WWK', gender: 'WOMEN' },
    { name: 'Women Fashion Heels & Flats', code: 'WFL', gender: 'WOMEN' },
    { name: 'Kids Sports & School Shoes', code: 'KID', gender: 'KIDS' },
  ];

  const categories = {};
  for (const c of categoriesData) {
    categories[c.code] = await prisma.category.create({ data: c });
  }

  // 5. Store Location Hierarchy: Floor -> Department -> Rack -> Shelf -> Position
  const floorG = await prisma.floor.create({ data: { name: 'Ground Floor', code: 'FL-G', level: 0 } });
  const floor1 = await prisma.floor.create({ data: { name: 'First Floor', code: 'FL-1', level: 1 } });

  const deptMen = await prisma.department.create({
    data: { name: "Men's Footwear Section", code: 'DEPT-MEN', floorId: floorG.id },
  });
  const deptSports = await prisma.department.create({
    data: { name: 'Sports & Athleisure Section', code: 'DEPT-SPT', floorId: floorG.id },
  });
  const deptWomen = await prisma.department.create({
    data: { name: "Women's Footwear Section", code: 'DEPT-WMN', floorId: floor1.id },
  });
  const deptKids = await prisma.department.create({
    data: { name: "Kids' Footwear Section", code: 'DEPT-KID', floorId: floor1.id },
  });
  const deptClearance = await prisma.department.create({
    data: { name: 'Clearance & Promotional Corner', code: 'DEPT-CLR', floorId: floor1.id },
  });

  // Create Racks
  const rackConfigs = [
    { name: 'Men Formal Rack M1', code: 'RACK-M01', deptId: deptMen.id, type: 'NORMAL' },
    { name: 'Men Loafers Rack M2', code: 'RACK-M02', deptId: deptMen.id, type: 'NORMAL' },
    { name: 'Men Boots & Outdoor M12', code: 'RACK-M12', deptId: deptMen.id, type: 'NORMAL' },
    { name: 'Sports Running SP1', code: 'RACK-SP01', deptId: deptSports.id, type: 'NORMAL' },
    { name: 'Sports Lifestyle SP2', code: 'RACK-SP02', deptId: deptSports.id, type: 'NORMAL' },
    { name: 'Women Athleisure W1', code: 'RACK-W01', deptId: deptWomen.id, type: 'NORMAL' },
    { name: 'Women Casual & Flats W2', code: 'RACK-W02', deptId: deptWomen.id, type: 'NORMAL' },
    { name: 'Kids Active K1', code: 'RACK-K01', deptId: deptKids.id, type: 'NORMAL' },
    { name: 'Assorted Clearance Rack', code: 'RACK-ASSORTED', deptId: deptClearance.id, type: 'ASSORTED' },
    { name: 'Deep Discount Rack 50%', code: 'RACK-DEEP-DISC', deptId: deptClearance.id, type: 'DEEP_DISCOUNT' },
    { name: 'Front Entrance Display', code: 'RACK-DISPLAY-01', deptId: deptSports.id, type: 'DISPLAY' },
  ];

  const locations = [];
  for (const rc of rackConfigs) {
    const rack = await prisma.rack.create({
      data: { name: rc.name, code: rc.code, rackType: rc.type, departmentId: rc.deptId },
    });

    for (let s = 1; s <= 4; s++) {
      const shelf = await prisma.shelf.create({
        data: {
          shelfNumber: s,
          code: `${rc.code}-S${s}`,
          rackId: rack.id,
        },
      });

      for (let p = 1; p <= 6; p++) {
        const posStr = p < 10 ? `0${p}` : `${p}`;
        const loc = await prisma.rackLocation.create({
          data: {
            shelfId: shelf.id,
            position: posStr,
            fullCode: `${rc.code}-S${s}-P${posStr}`,
            isOccupied: false,
          },
        });
        locations.push(loc);
      }
    }
  }

  // 6. Vendors
  const vendorsData = [
    {
      name: 'Metro Footwear Distributors Pvt Ltd',
      code: 'VND-METRO',
      contactPerson: 'Suresh Singhania',
      phone: '+91 98200 11998',
      email: 'orders@metrodistributors.com',
      address: 'Industrial Area Phase 2, Peenya, Bangalore',
      gstin: '29AAACM1234K1Z2',
      creditPeriodDays: 30,
      totalPurchases: 450000,
      outstandingAmount: 85000,
    },
    {
      name: 'Apex Sports Gear India',
      code: 'VND-APEX',
      contactPerson: 'Ramesh Chawla',
      phone: '+91 98110 55223',
      email: 'sales@apexsportsindia.com',
      address: 'Okhla Industrial Area Phase 3, New Delhi',
      gstin: '07AAACA4567M1Z4',
      creditPeriodDays: 45,
      totalPurchases: 620000,
      outstandingAmount: 110000,
    },
    {
      name: 'Classic Leather Crafts Agra',
      code: 'VND-CLASSIC',
      contactPerson: 'Mohd. Farhan',
      phone: '+91 94120 77889',
      email: 'farhan@classicleathers.in',
      address: 'Tajganj Leather Complex, Agra, UP',
      gstin: '09AAACC9876P1Z1',
      creditPeriodDays: 30,
      totalPurchases: 310000,
      outstandingAmount: 42000,
    },
    {
      name: 'Vibrant Footwear Logistics',
      code: 'VND-VIBRANT',
      contactPerson: 'Kavita Menon',
      phone: '+91 98480 33211',
      email: 'kavita@vibrantlogistics.com',
      address: 'Whitefield Main Road, Bangalore',
      gstin: '29AAACV5432J1Z0',
      creditPeriodDays: 60,
      totalPurchases: 280000,
      outstandingAmount: 0,
    },
  ];

  const vendors = {};
  for (const v of vendorsData) {
    vendors[v.code] = await prisma.vendor.create({ data: v });
  }

  // 7. Customers
  const customersData = [
    { name: 'Karthik Narayanan', phone: '9845012340', email: 'karthik.n@gmail.com', address: 'Indiranagar, Bangalore' },
    { name: 'Sneha Roy', phone: '9880123450', email: 'sneha.roy@outlook.com', address: 'Koramangala 4th Block, Bangalore' },
    { name: 'Rahul Deshmukh', phone: '9741098760', email: 'rahul.d@yahoo.com', address: 'HSR Layout Sector 2, Bangalore' },
    { name: 'Ananya Iyer', phone: '9845187650', email: 'ananya.iyer@gmail.com', address: 'Jayanagar 4th T Block, Bangalore' },
    { name: 'Deepak Varma', phone: '9900234560', email: 'deepak.v@rediffmail.com', address: 'Malleshwaram 15th Cross, Bangalore' },
    { name: 'Pooja Hegde', phone: '9886054320', email: 'pooja.h@gmail.com', address: 'BTM Layout 2nd Stage, Bangalore' },
    { name: 'Naveen Kumar', phone: '9739012399', email: 'naveen.k@gmail.com', address: 'JP Nagar Phase 6, Bangalore' },
  ];

  const customers = [];
  for (const c of customersData) {
    customers.push(await prisma.customer.create({ data: c }));
  }

  // 8. 32 Footwear Products with Variants, Stock, Ageing, Racks
  const productsCatalog = [
    {
      name: 'Nike Air Zoom Pegasus 40',
      articleNumber: 'NKE-PEG-40',
      brand: 'NKE',
      category: 'RUN',
      gender: 'MEN',
      mrp: 10495,
      baseSellingPrice: 8999,
      purchasePrice: 5200,
      description: 'Responsive daily running shoe with dual Zoom Air units and engineered mesh upper.',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Black / White', sku: 'NKE-PEG40-BLK-07', barcode: '8901234500011', qty: 6, ageDays: 14, minStock: 2 },
        { size: 'UK 8', colour: 'Black / White', sku: 'NKE-PEG40-BLK-08', barcode: '8901234500028', qty: 9, ageDays: 14, minStock: 2 },
        { size: 'UK 9', colour: 'Black / White', sku: 'NKE-PEG40-BLK-09', barcode: '8901234500035', qty: 5, ageDays: 14, minStock: 2 },
        { size: 'UK 8', colour: 'Crimson Red', sku: 'NKE-PEG40-RED-08', barcode: '8901234500042', qty: 4, ageDays: 25, minStock: 2 },
      ],
    },
    {
      name: 'Adidas Ultraboost Light',
      articleNumber: 'ADS-UB-LGT',
      brand: 'ADS',
      category: 'RUN',
      gender: 'UNISEX',
      mrp: 14999,
      baseSellingPrice: 12499,
      purchasePrice: 7200,
      description: 'Lightest Ultraboost ever made with 30% lighter Light BOOST material and Primeknit+ upper.',
      imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Core Black', sku: 'ADS-UBL-BLK-07', barcode: '8901234500059', qty: 4, ageDays: 20, minStock: 2 },
        { size: 'UK 8', colour: 'Core Black', sku: 'ADS-UBL-BLK-08', barcode: '8901234500066', qty: 7, ageDays: 20, minStock: 2 },
        { size: 'UK 9', colour: 'Solar Red', sku: 'ADS-UBL-RED-09', barcode: '8901234500073', qty: 2, ageDays: 68, minStock: 2 },
      ],
    },
    {
      name: 'Puma Nitro Velocity 3',
      articleNumber: 'PMA-NIT-03',
      brand: 'PMA',
      category: 'RUN',
      gender: 'MEN',
      mrp: 9999,
      baseSellingPrice: 7499,
      purchasePrice: 4200,
      description: 'Nitrogen-infused foam midsole offering lightweight explosive cushioning for road runs.',
      imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Electric Lime', sku: 'PMA-NIT3-LIM-07', barcode: '8901234500080', qty: 5, ageDays: 18, minStock: 2 },
        { size: 'UK 8', colour: 'Electric Lime', sku: 'PMA-NIT3-LIM-08', barcode: '8901234500097', qty: 6, ageDays: 18, minStock: 2 },
        { size: 'UK 8', colour: 'Puma Black', sku: 'PMA-NIT3-BLK-08', barcode: '8901234500103', qty: 8, ageDays: 15, minStock: 2 },
      ],
    },
    {
      name: 'Bata Ambassador Oxford Derby',
      articleNumber: 'BTA-AMB-OXF',
      brand: 'BTA',
      category: 'FRM',
      gender: 'MEN',
      mrp: 4499,
      baseSellingPrice: 3499,
      purchasePrice: 1950,
      description: 'Handcrafted genuine calfskin leather formal oxford shoes with cushioned footbed.',
      imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Classic Tan', sku: 'BTA-AMB-TAN-07', barcode: '8901234500110', qty: 8, ageDays: 35, minStock: 3 },
        { size: 'UK 8', colour: 'Classic Tan', sku: 'BTA-AMB-TAN-08', barcode: '8901234500127', qty: 12, ageDays: 35, minStock: 3 },
        { size: 'UK 9', colour: 'Classic Tan', sku: 'BTA-AMB-TAN-09', barcode: '8901234500134', qty: 6, ageDays: 35, minStock: 3 },
        { size: 'UK 8', colour: 'Midnight Black', sku: 'BTA-AMB-BLK-08', barcode: '8901234500141', qty: 10, ageDays: 40, minStock: 3 },
      ],
    },
    {
      name: 'Woodland Leather Commando Boots',
      articleNumber: 'WDL-CMD-BOT',
      brand: 'WDL',
      category: 'BOT',
      gender: 'MEN',
      mrp: 6995,
      baseSellingPrice: 5995,
      purchasePrice: 3400,
      description: 'Rugged nubuck leather high-ankle outdoor boots with deep-tread grooved rubber sole.',
      imageUrl: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Khaki Camel', sku: 'WDL-CMD-KHK-07', barcode: '8901234500158', qty: 5, ageDays: 50, minStock: 2 },
        { size: 'UK 8', colour: 'Khaki Camel', sku: 'WDL-CMD-KHK-08', barcode: '8901234500165', qty: 8, ageDays: 50, minStock: 2 },
        { size: 'UK 9', colour: 'Olive Green', sku: 'WDL-CMD-OLV-09', barcode: '8901234500172', qty: 3, ageDays: 95, minStock: 2, clearanceTier: 'CLEARANCE_RECOMMENDED', clearanceStatus: 'ASSORTED_RACK', clearanceDiscount: 20 },
      ],
    },
    {
      name: 'Red Tape Classic Penny Loafers',
      articleNumber: 'RDT-PNY-LFR',
      brand: 'RDT',
      category: 'LFR',
      gender: 'MEN',
      mrp: 4999,
      baseSellingPrice: 2299,
      purchasePrice: 1100,
      description: 'Soft genuine leather slip-on penny loafers designed for boardroom meetings and formal galas.',
      imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Deep Brown', sku: 'RDT-PNY-BRN-07', barcode: '8901234500189', qty: 7, ageDays: 45, minStock: 2 },
        { size: 'UK 8', colour: 'Deep Brown', sku: 'RDT-PNY-BRN-08', barcode: '8901234500196', qty: 11, ageDays: 45, minStock: 2 },
        { size: 'UK 9', colour: 'Jet Black', sku: 'RDT-PNY-BLK-09', barcode: '8901234500202', qty: 4, ageDays: 45, minStock: 2 },
      ],
    },
    {
      name: 'Skechers GO WALK 6 Iconic',
      articleNumber: 'SKC-GW6-ICN',
      brand: 'SKC',
      category: 'WWK',
      gender: 'WOMEN',
      mrp: 6499,
      baseSellingPrice: 5299,
      purchasePrice: 3000,
      description: 'Ultra-lightweight responsive ULTRA GO cushioning with high-rebound Hyper Pillar Technology.',
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 5', colour: 'Slate Grey / Pink', sku: 'SKC-GW6-GRY-05', barcode: '8901234500219', qty: 6, ageDays: 16, minStock: 2 },
        { size: 'UK 6', colour: 'Slate Grey / Pink', sku: 'SKC-GW6-GRY-06', barcode: '8901234500226', qty: 9, ageDays: 16, minStock: 2 },
        { size: 'UK 7', colour: 'Navy Heather', sku: 'SKC-GW6-NVY-07', barcode: '8901234500233', qty: 5, ageDays: 16, minStock: 2 },
      ],
    },
    {
      name: 'Campus Rodeo Casual Sneakers',
      articleNumber: 'CMP-ROD-SNK',
      brand: 'CMP',
      category: 'SNK',
      gender: 'MEN',
      mrp: 1899,
      baseSellingPrice: 1499,
      purchasePrice: 750,
      description: 'Trendy breathable knitted casual sneakers with memory foam insole for college and city wear.',
      imageUrl: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'White / Royal Blue', sku: 'CMP-ROD-WHT-07', barcode: '8901234500240', qty: 14, ageDays: 22, minStock: 3 },
        { size: 'UK 8', colour: 'White / Royal Blue', sku: 'CMP-ROD-WHT-08', barcode: '8901234500257', qty: 18, ageDays: 22, minStock: 3 },
        { size: 'UK 9', colour: 'White / Royal Blue', sku: 'CMP-ROD-WHT-09', barcode: '8901234500264', qty: 12, ageDays: 22, minStock: 3 },
        { size: 'UK 8', colour: 'Pitch Black', sku: 'CMP-ROD-BLK-08', barcode: '8901234500271', qty: 15, ageDays: 22, minStock: 3 },
      ],
    },
    {
      name: 'Sparx Men Athletic Floater Sandals',
      articleNumber: 'SPX-FLT-SND',
      brand: 'SPX',
      category: 'SND',
      gender: 'MEN',
      mrp: 1199,
      baseSellingPrice: 949,
      purchasePrice: 480,
      description: 'Water-resistant synthetic straps with Velcro closure and non-slip textured footbed.',
      imageUrl: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Grey / Orange', sku: 'SPX-FLT-GRO-07', barcode: '8901234500288', qty: 10, ageDays: 28, minStock: 3 },
        { size: 'UK 8', colour: 'Grey / Orange', sku: 'SPX-FLT-GRO-08', barcode: '8901234500295', qty: 16, ageDays: 28, minStock: 3 },
        { size: 'UK 9', colour: 'Navy / Blue', sku: 'SPX-FLT-NVB-09', barcode: '8901234500301', qty: 8, ageDays: 28, minStock: 3 },
      ],
    },
    {
      name: 'Clarks Whiddon Cap Leather Oxford',
      articleNumber: 'CLK-WHD-CAP',
      brand: 'CLK',
      category: 'FRM',
      gender: 'MEN',
      mrp: 8999,
      baseSellingPrice: 7499,
      purchasePrice: 4300,
      description: 'Burnished full-grain leather dress shoe with OrthoLite footbed and subtle elastic gore.',
      imageUrl: 'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Dark Tan Leather', sku: 'CLK-WHD-TAN-07', barcode: '8901234500318', qty: 4, ageDays: 48, minStock: 2 },
        { size: 'UK 8', colour: 'Dark Tan Leather', sku: 'CLK-WHD-TAN-08', barcode: '8901234500325', qty: 6, ageDays: 48, minStock: 2 },
        { size: 'UK 9', colour: 'Black Leather', sku: 'CLK-WHD-BLK-09', barcode: '8901234500332', qty: 3, ageDays: 48, minStock: 2 },
      ],
    },
    {
      name: 'Nike Court Vision Low Casuals',
      articleNumber: 'NKE-CRT-VIS',
      brand: 'NKE',
      category: 'SNK',
      gender: 'UNISEX',
      mrp: 5695,
      baseSellingPrice: 4799,
      purchasePrice: 2800,
      description: '80s retro basketball style sneaker made with at least 20% recycled materials by weight.',
      imageUrl: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Triple White', sku: 'NKE-CRT-WHT-07', barcode: '8901234500349', qty: 7, ageDays: 21, minStock: 2 },
        { size: 'UK 8', colour: 'Triple White', sku: 'NKE-CRT-WHT-08', barcode: '8901234500356', qty: 11, ageDays: 21, minStock: 2 },
        { size: 'UK 9', colour: 'White / Gym Red', sku: 'NKE-CRT-RED-09', barcode: '8901234500363', qty: 5, ageDays: 32, minStock: 2 },
      ],
    },
    {
      name: 'Adidas Galaxy 6 M Running',
      articleNumber: 'ADS-GLX-06',
      brand: 'ADS',
      category: 'RUN',
      gender: 'MEN',
      mrp: 4999,
      baseSellingPrice: 3799,
      purchasePrice: 2100,
      description: 'Cloudfoam midsole gives a pillow-soft step with OrthoLite sockliner and durable rubber outsole.',
      imageUrl: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Legend Ink Navy', sku: 'ADS-GLX-NVY-07', barcode: '8901234500370', qty: 6, ageDays: 35, minStock: 2 },
        { size: 'UK 8', colour: 'Legend Ink Navy', sku: 'ADS-GLX-NVY-08', barcode: '8901234500387', qty: 8, ageDays: 35, minStock: 2 },
        { size: 'UK 9', colour: 'Carbon Grey', sku: 'ADS-GLX-GRY-09', barcode: '8901234500394', qty: 4, ageDays: 35, minStock: 2 },
      ],
    },
    {
      name: 'Bata Power Walking Elite',
      articleNumber: 'BTA-PWR-WLK',
      brand: 'BTA',
      category: 'WWK',
      gender: 'WOMEN',
      mrp: 2999,
      baseSellingPrice: 2299,
      purchasePrice: 1200,
      description: 'Engineered mesh with shock-absorbing phylon sole specially contoured for female arches.',
      imageUrl: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 5', colour: 'Teal Green', sku: 'BTA-PWR-TEL-05', barcode: '8901234500400', qty: 5, ageDays: 19, minStock: 2 },
        { size: 'UK 6', colour: 'Teal Green', sku: 'BTA-PWR-TEL-06', barcode: '8901234500417', qty: 7, ageDays: 19, minStock: 2 },
        { size: 'UK 7', colour: 'Lavender Mist', sku: 'BTA-PWR-LAV-07', barcode: '8901234500424', qty: 4, ageDays: 19, minStock: 2 },
      ],
    },
    {
      name: 'Woodland Suede Leather Chelsea Boots',
      articleNumber: 'WDL-SUD-CHL',
      brand: 'WDL',
      category: 'BOT',
      gender: 'MEN',
      mrp: 7495,
      baseSellingPrice: 6295,
      purchasePrice: 3600,
      description: 'Water-resistant premium suede finish with dual-side elastic webbing and pull loops.',
      imageUrl: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Snuff Suede Brown', sku: 'WDL-CHL-BRN-07', barcode: '8901234500431', qty: 3, ageDays: 78, minStock: 2, clearanceTier: 'AGEING' },
        { size: 'UK 8', colour: 'Snuff Suede Brown', sku: 'WDL-CHL-BRN-08', barcode: '8901234500448', qty: 2, ageDays: 78, minStock: 2, clearanceTier: 'AGEING' },
      ],
    },
    {
      name: 'Puma Smash v2 Leather Sneakers',
      articleNumber: 'PMA-SMH-V2',
      brand: 'PMA',
      category: 'SNK',
      gender: 'UNISEX',
      mrp: 4499,
      baseSellingPrice: 3199,
      purchasePrice: 1700,
      description: 'Tennis-inspired silhouette with clean leather exterior and iconic Puma Formstrip.',
      imageUrl: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Puma White / Black', sku: 'PMA-SMH-WB-07', barcode: '8901234500455', qty: 8, ageDays: 27, minStock: 2 },
        { size: 'UK 8', colour: 'Puma White / Black', sku: 'PMA-SMH-WB-08', barcode: '8901234500462', qty: 10, ageDays: 27, minStock: 2 },
        { size: 'UK 9', colour: 'Full Black', sku: 'PMA-SMH-BLK-09', barcode: '8901234500479', qty: 6, ageDays: 27, minStock: 2 },
      ],
    },
    {
      name: 'Bata Marie Claire Block Heel Pumps',
      articleNumber: 'BTA-MCL-BLK',
      brand: 'BTA',
      category: 'WFL',
      gender: 'WOMEN',
      mrp: 2799,
      baseSellingPrice: 2199,
      purchasePrice: 1050,
      description: 'Comfortable 2-inch block heel pump with extra cushion insock for day-long office comfort.',
      imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 5', colour: 'Glossy Black', sku: 'BTA-MCL-BLK-05', barcode: '8901234500486', qty: 5, ageDays: 38, minStock: 2 },
        { size: 'UK 6', colour: 'Glossy Black', sku: 'BTA-MCL-BLK-06', barcode: '8901234500493', qty: 7, ageDays: 38, minStock: 2 },
        { size: 'UK 6', colour: 'Nude Beige', sku: 'BTA-MCL-NUD-06', barcode: '8901234500509', qty: 4, ageDays: 38, minStock: 2 },
      ],
    },
    {
      name: 'Campus Kids Light-Up Flash Sneakers',
      articleNumber: 'CMP-KID-LGT',
      brand: 'CMP',
      category: 'KID',
      gender: 'KIDS',
      mrp: 1499,
      baseSellingPrice: 1199,
      purchasePrice: 580,
      description: 'Fun step-activated LED lights in the translucent outsole with easy Velcro straps.',
      imageUrl: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 1', colour: 'Royal Blue / Neon Red', sku: 'CMP-KID-BLU-01', barcode: '8901234500516', qty: 9, ageDays: 24, minStock: 2 },
        { size: 'UK 2', colour: 'Royal Blue / Neon Red', sku: 'CMP-KID-BLU-02', barcode: '8901234500523', qty: 11, ageDays: 24, minStock: 2 },
        { size: 'UK 3', colour: 'Candy Pink', sku: 'CMP-KID-PNK-03', barcode: '8901234500530', qty: 8, ageDays: 24, minStock: 2 },
      ],
    },
    {
      name: 'Nike Revolution 6 Next Nature',
      articleNumber: 'NKE-REV-06',
      brand: 'NKE',
      category: 'RUN',
      gender: 'MEN',
      mrp: 3995,
      baseSellingPrice: 3495,
      purchasePrice: 1950,
      description: 'Plush foam midsole offers soft ride with breathable mesh placed at collar for maximum comfort.',
      imageUrl: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Black / Dark Smoke', sku: 'NKE-REV6-BLK-07', barcode: '8901234500547', qty: 7, ageDays: 22, minStock: 2 },
        { size: 'UK 8', colour: 'Black / Dark Smoke', sku: 'NKE-REV6-BLK-08', barcode: '8901234500554', qty: 10, ageDays: 22, minStock: 2 },
        { size: 'UK 9', colour: 'Thunder Blue', sku: 'NKE-REV6-BLU-09', barcode: '8901234500561', qty: 6, ageDays: 22, minStock: 2 },
      ],
    },
    {
      name: 'Red Tape Men Walking Slip-on Athleisure',
      articleNumber: 'RDT-WLK-SLP',
      brand: 'RDT',
      category: 'SNK',
      gender: 'MEN',
      mrp: 3899,
      baseSellingPrice: 1799,
      purchasePrice: 850,
      description: 'Slip-on mesh construction with memory foam insole providing dynamic arch support.',
      imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Charcoal Grey', sku: 'RDT-WLK-GRY-07', barcode: '8901234500578', qty: 12, ageDays: 31, minStock: 3 },
        { size: 'UK 8', colour: 'Charcoal Grey', sku: 'RDT-WLK-GRY-08', barcode: '8901234500585', qty: 15, ageDays: 31, minStock: 3 },
        { size: 'UK 9', colour: 'Airforce Blue', sku: 'RDT-WLK-BLU-09', barcode: '8901234500592', qty: 9, ageDays: 31, minStock: 3 },
      ],
    },
    {
      name: 'Sparx Running Shoes SX0675G',
      articleNumber: 'SPX-RUN-675',
      brand: 'SPX',
      category: 'RUN',
      gender: 'MEN',
      mrp: 1599,
      baseSellingPrice: 1299,
      purchasePrice: 650,
      description: 'High tensile mesh upper with responsive EVA midsole for daily morning jogs.',
      imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Black / Golden Yellow', sku: 'SPX-675-BKY-07', barcode: '8901234500608', qty: 10, ageDays: 20, minStock: 3 },
        { size: 'UK 8', colour: 'Black / Golden Yellow', sku: 'SPX-675-BKY-08', barcode: '8901234500615', qty: 14, ageDays: 20, minStock: 3 },
      ],
    },
    {
      name: 'Woodland Camel Casual Derby Shoes',
      articleNumber: 'WDL-CML-DRB',
      brand: 'WDL',
      category: 'FRM',
      gender: 'MEN',
      mrp: 5295,
      baseSellingPrice: 4495,
      purchasePrice: 2400,
      description: 'Semi-formal milled leather finish with antique metal eyelets and heavy-duty grip sole.',
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Camel Tan', sku: 'WDL-DRB-CML-07', barcode: '8901234500622', qty: 1, ageDays: 145, minStock: 2, clearanceTier: 'DEEP_CLEARANCE', clearanceStatus: 'DEEP_DISCOUNT_RACK', clearanceDiscount: 50 },
        { size: 'UK 8', colour: 'Camel Tan', sku: 'WDL-DRB-CML-08', barcode: '8901234500639', qty: 1, ageDays: 145, minStock: 2, clearanceTier: 'DEEP_CLEARANCE', clearanceStatus: 'DEEP_DISCOUNT_RACK', clearanceDiscount: 50 },
      ],
    },
    {
      name: 'Clarks Cotrell Step Slip-on Loafer',
      articleNumber: 'CLK-COT-STP',
      brand: 'CLK',
      category: 'LFR',
      gender: 'MEN',
      mrp: 7999,
      baseSellingPrice: 6599,
      purchasePrice: 3800,
      description: 'Oily leather upper with contrast stitching and Cushion Soft padding with removable EVA footbed.',
      imageUrl: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 8', colour: 'Tobacco Brown', sku: 'CLK-COT-TBC-08', barcode: '8901234500646', qty: 4, ageDays: 55, minStock: 2 },
        { size: 'UK 9', colour: 'Tobacco Brown', sku: 'CLK-COT-TBC-09', barcode: '8901234500653', qty: 5, ageDays: 55, minStock: 2 },
      ],
    },
    {
      name: 'Adidas Superstar Originals',
      articleNumber: 'ADS-SST-ORG',
      brand: 'ADS',
      category: 'SNK',
      gender: 'UNISEX',
      mrp: 8999,
      baseSellingPrice: 7999,
      purchasePrice: 4500,
      description: 'Legendary shell-toe leather sneakers with serrated 3-Stripes and herringbone rubber cupsole.',
      imageUrl: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Cloud White / Core Black', sku: 'ADS-SST-WHT-07', barcode: '8901234500660', qty: 6, ageDays: 15, minStock: 2 },
        { size: 'UK 8', colour: 'Cloud White / Core Black', sku: 'ADS-SST-WHT-08', barcode: '8901234500677', qty: 9, ageDays: 15, minStock: 2 },
        { size: 'UK 9', colour: 'Cloud White / Core Black', sku: 'ADS-SST-WHT-09', barcode: '8901234500684', qty: 5, ageDays: 15, minStock: 2 },
      ],
    },
    {
      name: 'Nike Air Max SC Lifestyle',
      articleNumber: 'NKE-AMX-SC',
      brand: 'NKE',
      category: 'SNK',
      gender: 'MEN',
      mrp: 6995,
      baseSellingPrice: 5995,
      purchasePrice: 3400,
      description: 'Visible Air cushioning with rich mix of real and synthetic leather and airy mesh.',
      imageUrl: 'https://images.unsplash.com/photo-1586525198428-225f6f12cff5?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'White / University Red', sku: 'NKE-AMX-RED-07', barcode: '8901234500691', qty: 4, ageDays: 23, minStock: 2 },
        { size: 'UK 8', colour: 'White / University Red', sku: 'NKE-AMX-RED-08', barcode: '8901234500707', qty: 7, ageDays: 23, minStock: 2 },
      ],
    },
    {
      name: 'Skechers D-Lites Fresh Start',
      articleNumber: 'SKC-DLT-FSH',
      brand: 'SKC',
      category: 'SNK',
      gender: 'WOMEN',
      mrp: 5999,
      baseSellingPrice: 4799,
      purchasePrice: 2600,
      description: 'Chunky retro dad sneaker profile with smooth leather and Air-Cooled Memory Foam insole.',
      imageUrl: 'https://images.unsplash.com/photo-1520256862855-398228c41684?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 5', colour: 'White / Silver Edge', sku: 'SKC-DLT-WHT-05', barcode: '8901234500714', qty: 5, ageDays: 30, minStock: 2 },
        { size: 'UK 6', colour: 'White / Silver Edge', sku: 'SKC-DLT-WHT-06', barcode: '8901234500721', qty: 8, ageDays: 30, minStock: 2 },
      ],
    },
    {
      name: 'Puma Softride Rift Tech Running',
      articleNumber: 'PMA-SFT-RFT',
      brand: 'PMA',
      category: 'RUN',
      gender: 'MEN',
      mrp: 5499,
      baseSellingPrice: 3999,
      purchasePrice: 2100,
      description: 'Plush Softride cushioning in midsole with asymmetric lacing for locked-down support.',
      imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Castlerock Grey', sku: 'PMA-SFT-GRY-07', barcode: '8901234500738', qty: 5, ageDays: 34, minStock: 2 },
        { size: 'UK 8', colour: 'Castlerock Grey', sku: 'PMA-SFT-GRY-08', barcode: '8901234500745', qty: 7, ageDays: 34, minStock: 2 },
      ],
    },
    {
      name: 'Bata Hush Puppies Formal Slip-on',
      articleNumber: 'BTA-HSH-SLP',
      brand: 'BTA',
      category: 'FRM',
      gender: 'MEN',
      mrp: 5999,
      baseSellingPrice: 4999,
      purchasePrice: 2800,
      description: 'Premium Hush Puppies Bounce technology footbed that absorbs shocks and returns energy.',
      imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 8', colour: 'Deep Burgundy', sku: 'BTA-HSH-BUR-08', barcode: '8901234500752', qty: 6, ageDays: 42, minStock: 2 },
        { size: 'UK 9', colour: 'Deep Burgundy', sku: 'BTA-HSH-BUR-09', barcode: '8901234500769', qty: 4, ageDays: 42, minStock: 2 },
      ],
    },
    {
      name: 'Campus Oxyfit Running Shoes',
      articleNumber: 'CMP-OXY-RUN',
      brand: 'CMP',
      category: 'RUN',
      gender: 'MEN',
      mrp: 1699,
      baseSellingPrice: 1349,
      purchasePrice: 680,
      description: 'Vibrant training running shoes with breathable vamp mesh and anti-skid traction ridges.',
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Navy / Neon Orange', sku: 'CMP-OXY-NVY-07', barcode: '8901234500776', qty: 11, ageDays: 26, minStock: 3 },
        { size: 'UK 8', colour: 'Navy / Neon Orange', sku: 'CMP-OXY-NVY-08', barcode: '8901234500783', qty: 15, ageDays: 26, minStock: 3 },
      ],
    },
    {
      name: 'Sparx Women Performance Walking SX0112L',
      articleNumber: 'SPX-WMN-112',
      brand: 'SPX',
      category: 'WWK',
      gender: 'WOMEN',
      mrp: 1399,
      baseSellingPrice: 1099,
      purchasePrice: 540,
      description: 'Feather-light slip-on walking footwear with breathable elastic textile upper.',
      imageUrl: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 5', colour: 'Soft Mauve', sku: 'SPX-112-MUV-05', barcode: '8901234500790', qty: 7, ageDays: 25, minStock: 2 },
        { size: 'UK 6', colour: 'Soft Mauve', sku: 'SPX-112-MUV-06', barcode: '8901234500806', qty: 9, ageDays: 25, minStock: 2 },
      ],
    },
    {
      name: 'Red Tape High Ankle Street Sneakers',
      articleNumber: 'RDT-HGH-SNK',
      brand: 'RDT',
      category: 'SNK',
      gender: 'MEN',
      mrp: 4799,
      baseSellingPrice: 2399,
      purchasePrice: 1200,
      description: 'Streetwear high top sneaker with padded ankle collar and cupsole construction.',
      imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 7', colour: 'Triple Black', sku: 'RDT-HGH-BLK-07', barcode: '8901234500813', qty: 8, ageDays: 39, minStock: 2 },
        { size: 'UK 8', colour: 'Triple Black', sku: 'RDT-HGH-BLK-08', barcode: '8901234500820', qty: 12, ageDays: 39, minStock: 2 },
      ],
    },
    {
      name: 'Bata School Shoes Tough Toe',
      articleNumber: 'BTA-SCH-TF',
      brand: 'BTA',
      category: 'KID',
      gender: 'KIDS',
      mrp: 999,
      baseSellingPrice: 799,
      purchasePrice: 400,
      description: 'Reinforced toe bumper black uniform shoes with easy hook-and-loop strap for school children.',
      imageUrl: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 1', colour: 'School Black', sku: 'BTA-SCH-BLK-01', barcode: '8901234500837', qty: 18, ageDays: 12, minStock: 4 },
        { size: 'UK 2', colour: 'School Black', sku: 'BTA-SCH-BLK-02', barcode: '8901234500844', qty: 22, ageDays: 12, minStock: 4 },
        { size: 'UK 3', colour: 'School Black', sku: 'BTA-SCH-BLK-03', barcode: '8901234500851', qty: 16, ageDays: 12, minStock: 4 },
      ],
    },
    {
      name: 'Woodland Deadstock Desert Booties 2025 Edition',
      articleNumber: 'WDL-DED-2025',
      brand: 'WDL',
      category: 'BOT',
      gender: 'MEN',
      mrp: 6495,
      baseSellingPrice: 2995,
      purchasePrice: 3200,
      description: 'Legacy collection rough suede boots from early last season with crepe sole.',
      imageUrl: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80',
      variants: [
        { size: 'UK 6', colour: 'Mustard Brown', sku: 'WDL-DED-MST-06', barcode: '8901234500868', qty: 2, ageDays: 220, minStock: 2, clearanceTier: 'DEAD_STOCK', clearanceStatus: 'DEEP_DISCOUNT_RACK', clearanceDiscount: 55 },
        { size: 'UK 10', colour: 'Mustard Brown', sku: 'WDL-DED-MST-10', barcode: '8901234500875', qty: 1, ageDays: 220, minStock: 2, clearanceTier: 'DEAD_STOCK', clearanceStatus: 'DEEP_DISCOUNT_RACK', clearanceDiscount: 55 },
      ],
    },
  ];

  let locIdx = 0;
  const createdVariants = [];

  for (const p of productsCatalog) {
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        articleNumber: p.articleNumber,
        brandId: brands[p.brand].id,
        categoryId: categories[p.category].id,
        gender: p.gender,
        description: p.description,
        imageUrl: p.imageUrl,
        baseSellingPrice: p.baseSellingPrice,
        mrp: p.mrp,
        purchasePrice: p.purchasePrice,
      },
    });

    for (const v of p.variants) {
      const loc = locations[locIdx % locations.length];
      locIdx++;

      // calculate entry date based on ageDays
      const entryDate = new Date();
      entryDate.setDate(entryDate.getDate() - (v.ageDays || 15));

      let tier = 'FRESH';
      if (v.clearanceTier) {
        tier = v.clearanceTier;
      } else if (v.ageDays > 180) {
        tier = 'DEAD_STOCK';
      } else if (v.ageDays > 120) {
        tier = 'DEEP_CLEARANCE';
      } else if (v.ageDays > 90) {
        tier = 'CLEARANCE_RECOMMENDED';
      } else if (v.ageDays > 60) {
        tier = 'AGEING';
      } else if (v.ageDays > 30) {
        tier = 'NORMAL';
      }

      const variant = await prisma.productVariant.create({
        data: {
          productId: prod.id,
          size: v.size,
          colour: v.colour,
          sku: v.sku,
          barcode: v.barcode,
          purchasePrice: p.purchasePrice,
          sellingPrice: p.baseSellingPrice,
          mrp: p.mrp,
          rackLocationId: loc.id,
          displayStockQty: 1,
          entryDate,
          clearanceTier: tier,
          clearanceStatus: v.clearanceStatus || 'NORMAL_RACK',
          clearanceDiscount: v.clearanceDiscount || 0,
          clearanceApproved: !!v.clearanceDiscount,
        },
      });

      // Mark location as occupied
      await prisma.rackLocation.update({
        where: { id: loc.id },
        data: { isOccupied: true },
      });

      // Create Inventory
      await prisma.inventory.create({
        data: {
          variantId: variant.id,
          quantity: v.qty,
          minStockAlert: v.minStock || 3,
          maxStock: 50,
          lastStockUpdate: new Date(),
        },
      });

      // Initial Stock Movement
      await prisma.stockMovement.create({
        data: {
          variantId: variant.id,
          type: 'PURCHASE',
          quantity: v.qty,
          previousQty: 0,
          newQty: v.qty,
          reason: 'Initial store inventory intake',
          userId: manager.id,
        },
      });

      createdVariants.push({
        ...variant,
        name: p.name,
        articleNumber: p.articleNumber,
      });
    }
  }

  // 9. Purchases (Historical & Ongoing)
  const purchase1 = await prisma.purchase.create({
    data: {
      invoiceNumber: 'PUR-2026-001',
      vendorId: vendors['VND-APEX'].id,
      purchaseDate: new Date(Date.now() - 35 * 86400000),
      totalAmount: 180000,
      taxAmount: 21600,
      discountAmount: 5000,
      grandTotal: 196600,
      paymentStatus: 'PAID',
      paidAmount: 196600,
      outstandingAmount: 0,
      createdById: manager.id,
      notes: 'Initial athletic running shoes consignment',
    },
  });

  const purchase2 = await prisma.purchase.create({
    data: {
      invoiceNumber: 'PUR-2026-002',
      vendorId: vendors['VND-METRO'].id,
      purchaseDate: new Date(Date.now() - 15 * 86400000),
      totalAmount: 220000,
      taxAmount: 26400,
      discountAmount: 8000,
      grandTotal: 238400,
      paymentStatus: 'PARTIAL',
      paidAmount: 150000,
      outstandingAmount: 88400,
      dueDate: new Date(Date.now() + 15 * 86400000),
      createdById: manager.id,
      notes: 'Mid-season casuals and sneakers restock',
    },
  });

  const purchase3 = await prisma.purchase.create({
    data: {
      invoiceNumber: 'PUR-2026-003',
      vendorId: vendors['VND-CLASSIC'].id,
      purchaseDate: new Date(Date.now() - 5 * 86400000),
      totalAmount: 95000,
      taxAmount: 11400,
      discountAmount: 2000,
      grandTotal: 104400,
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      outstandingAmount: 104400,
      dueDate: new Date(Date.now() + 25 * 86400000),
      createdById: manager.id,
      notes: 'Handcrafted leather shoes batch',
    },
  });

  // Link purchase items
  await prisma.purchaseItem.create({
    data: {
      purchaseId: purchase1.id,
      variantId: createdVariants[0].id,
      quantity: 15,
      unitCost: 5200,
      totalCost: 78000,
    },
  });

  await prisma.purchaseItem.create({
    data: {
      purchaseId: purchase2.id,
      variantId: createdVariants[10].id,
      quantity: 20,
      unitCost: 750,
      totalCost: 15000,
    },
  });

  // 10. Sample Completed Sales (for Sales Execs & Management tracking)
  const salesHistory = [
    {
      invoiceNumber: 'INV-2026-0001',
      customer: customers[0],
      exec: sales1,
      variant: createdVariants[0],
      qty: 1,
      paymentMethod: 'UPI',
      upiAmount: 8999,
      cashAmount: 0,
      cardAmount: 0,
      dateOffset: 4,
    },
    {
      invoiceNumber: 'INV-2026-0002',
      customer: customers[1],
      exec: sales2,
      variant: createdVariants[3],
      qty: 1,
      paymentMethod: 'CARD',
      upiAmount: 0,
      cashAmount: 0,
      cardAmount: 3499,
      dateOffset: 3,
    },
    {
      invoiceNumber: 'INV-2026-0003',
      customer: customers[2],
      exec: sales1,
      variant: createdVariants[7],
      qty: 2,
      paymentMethod: 'CASH',
      upiAmount: 0,
      cashAmount: 2998,
      cardAmount: 0,
      dateOffset: 2,
    },
    {
      invoiceNumber: 'INV-2026-0004',
      customer: customers[3],
      exec: sales3,
      variant: createdVariants[1],
      qty: 1,
      paymentMethod: 'SPLIT',
      upiAmount: 7000,
      cashAmount: 5499,
      cardAmount: 0,
      dateOffset: 1,
    },
    {
      invoiceNumber: 'INV-2026-0005',
      customer: customers[4],
      exec: sales2,
      variant: createdVariants[4],
      qty: 1,
      paymentMethod: 'UPI',
      upiAmount: 5995,
      cashAmount: 0,
      cardAmount: 0,
      dateOffset: 0, // Today's sale
    },
    {
      invoiceNumber: 'INV-2026-0006',
      customer: customers[5],
      exec: sales1,
      variant: createdVariants[10],
      qty: 2,
      paymentMethod: 'CARD',
      upiAmount: 0,
      cashAmount: 0,
      cardAmount: 2998,
      dateOffset: 0, // Today's sale
    },
  ];

  for (const s of salesHistory) {
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - s.dateOffset);

    const subtotal = s.variant.sellingPrice * s.qty;
    const gstRate = subtotal > 1000 ? 12 : 5;
    const taxAmount = Math.round((subtotal * gstRate) / 100);
    const grandTotal = subtotal + taxAmount;

    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: s.invoiceNumber,
        customerId: s.customer.id,
        salesExecutiveId: s.exec.id,
        saleDate,
        subtotal,
        discountAmount: 0,
        taxAmount,
        grandTotal,
        paymentMethod: s.paymentMethod,
        cashAmount: s.cashAmount || (s.paymentMethod === 'CASH' ? grandTotal : 0),
        upiAmount: s.upiAmount || (s.paymentMethod === 'UPI' ? grandTotal : 0),
        cardAmount: s.cardAmount || (s.paymentMethod === 'CARD' ? grandTotal : 0),
        paymentStatus: 'COMPLETED',
      },
    });

    await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        variantId: s.variant.id,
        quantity: s.qty,
        unitPrice: s.variant.sellingPrice,
        discountPercent: 0,
        taxPercent: gstRate,
        finalPrice: grandTotal,
      },
    });

    await prisma.customer.update({
      where: { id: s.customer.id },
      data: { totalPurchases: { increment: grandTotal } },
    });
  }

  // 11. Damaged Goods
  await prisma.damagedProduct.create({
    data: {
      variantId: createdVariants[1].id,
      damageType: 'SOLE_DETACHMENT',
      quantity: 1,
      damageDate: new Date(Date.now() - 7 * 86400000),
      responsibleUserId: sales1.id,
      status: 'UNDER_REPAIR',
      estimatedRepairCost: 450,
      expectedCorrectionDate: new Date(Date.now() + 3 * 86400000),
      notes: 'Right shoe front toe bumper adhesive loose from customer try-on.',
    },
  });

  await prisma.damagedProduct.create({
    data: {
      variantId: createdVariants[3].id,
      damageType: 'SCUFF_SCRATCH',
      quantity: 1,
      damageDate: new Date(Date.now() - 14 * 86400000),
      responsibleUserId: sales2.id,
      status: 'REPAIRED',
      estimatedRepairCost: 200,
      actualRepairCost: 180,
      notes: 'Leather buffed, polished and returned to display stock.',
    },
  });

  await prisma.damagedProduct.create({
    data: {
      variantId: createdVariants[8].id,
      damageType: 'TRANSIT_DAMAGE',
      quantity: 1,
      damageDate: new Date(Date.now() - 25 * 86400000),
      responsibleUserId: manager.id,
      status: 'WRITTEN_OFF',
      disposalDetails: 'Crushed box and torn collar during vendor logistics. Written off for insurance claim.',
    },
  });

  // 12. Sales Targets (Daily & Monthly)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0, 23, 59, 59);

  // Daily targets
  await prisma.salesTarget.create({
    data: {
      userId: sales1.id,
      targetType: 'DAILY',
      startDate: todayStart,
      endDate: todayEnd,
      targetAmount: 20000,
      targetPairs: 5,
      achievedAmount: 2998,
      achievedPairs: 2,
    },
  });

  await prisma.salesTarget.create({
    data: {
      userId: sales2.id,
      targetType: 'DAILY',
      startDate: todayStart,
      endDate: todayEnd,
      targetAmount: 18000,
      targetPairs: 4,
      achievedAmount: 5995,
      achievedPairs: 1,
    },
  });

  await prisma.salesTarget.create({
    data: {
      userId: sales3.id,
      targetType: 'DAILY',
      startDate: todayStart,
      endDate: todayEnd,
      targetAmount: 15000,
      targetPairs: 3,
      achievedAmount: 0,
      achievedPairs: 0,
    },
  });

  // Monthly targets
  await prisma.salesTarget.create({
    data: {
      userId: sales1.id,
      targetType: 'MONTHLY',
      startDate: monthStart,
      endDate: monthEnd,
      targetAmount: 350000,
      targetPairs: 75,
      achievedAmount: 142000,
      achievedPairs: 32,
    },
  });

  await prisma.salesTarget.create({
    data: {
      userId: sales2.id,
      targetType: 'MONTHLY',
      startDate: monthStart,
      endDate: monthEnd,
      targetAmount: 300000,
      targetPairs: 65,
      achievedAmount: 168000,
      achievedPairs: 38,
    },
  });

  await prisma.salesTarget.create({
    data: {
      userId: sales3.id,
      targetType: 'MONTHLY',
      startDate: monthStart,
      endDate: monthEnd,
      targetAmount: 250000,
      targetPairs: 55,
      achievedAmount: 89000,
      achievedPairs: 20,
    },
  });

  // 13. Financial Expenses
  const expensesData = [
    { category: 'Rent', title: 'Commercial Street Store Rent', amount: 85000, paymentMethod: 'BANK_TRANSFER' },
    { category: 'Staff Salary', title: 'Sales Staff Advance & Incentives', amount: 45000, paymentMethod: 'BANK_TRANSFER' },
    { category: 'Utilities', title: 'BESCOM Electricity Bill', amount: 14500, paymentMethod: 'UPI' },
    { category: 'Packaging', title: 'Custom Branded Shoe Bags & Tissue', amount: 8500, paymentMethod: 'CASH' },
    { category: 'Marketing', title: 'Local Instagram & Footwear Influencer Ads', amount: 12000, paymentMethod: 'CARD' },
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({ data: exp });
  }

  // 14. Capital Records
  await prisma.capitalRecord.create({
    data: {
      type: 'INITIAL_INVESTMENT',
      amount: 2500000,
      source: 'Founder Equity',
      description: 'Initial capital infusion for store setup, racks, interior and initial inventory',
      date: new Date('2025-01-10'),
    },
  });

  await prisma.capitalRecord.create({
    data: {
      type: 'ADDITIONAL_INVESTMENT',
      amount: 500000,
      source: 'Partner Working Capital Loan',
      description: 'Festival season expansion working capital',
      date: new Date('2025-10-01'),
    },
  });

  await prisma.capitalRecord.create({
    data: {
      type: 'WITHDRAWAL',
      amount: 150000,
      source: 'Owner Drawings',
      description: 'Quarterly dividend / drawings',
      date: new Date('2026-03-31'),
    },
  });

  // 15. Notifications
  await prisma.notification.create({
    data: {
      type: 'LOW_STOCK',
      title: 'Low Stock Alert: Adidas Ultraboost Solar Red',
      message: 'Only 2 pairs remaining for Adidas Ultraboost Light (Solar Red / UK 9). Consider re-ordering.',
      severity: 'WARNING',
      link: '/management/inventory',
    },
  });

  await prisma.notification.create({
    data: {
      type: 'AGEING_STOCK',
      title: 'Stock Ageing: Woodland Suede Chelsea',
      message: 'Woodland Suede Chelsea Boots have reached 78 days in store without turnover.',
      severity: 'WARNING',
      link: '/management/ageing',
    },
  });

  await prisma.notification.create({
    data: {
      type: 'CLEARANCE_RECOMMENDED',
      title: 'Clearance Recommendation: Woodland Camel Derby',
      message: 'Camel Derby pairs reached 145 days. Recommended 50% clearance discount pending approval.',
      severity: 'CRITICAL',
      link: '/management/ageing',
    },
  });

  await prisma.notification.create({
    data: {
      type: 'VENDOR_PAYMENT_DUE',
      title: 'Vendor Invoice Due: Metro Footwear Distributors',
      message: '₹88,400 due to Metro Footwear Distributors in 15 days.',
      severity: 'INFO',
      link: '/management/vendors',
    },
  });

  await prisma.notification.create({
    data: {
      type: 'DAMAGED_REPAIR_DUE',
      title: 'Damaged Item Repair Due: Adidas Ultraboost',
      message: 'Sole detachment repair expected back in 3 days.',
      severity: 'INFO',
      link: '/management/damaged',
    },
  });

  console.log('✅ Footwear ERP Database seeded successfully!');
  console.log('Demo Credentials:');
  console.log('  Management: admin@solefit.com / admin123');
  console.log('  Sales Executive: rajesh@solefit.com / sales123');
  console.log('  Sales Executive: priya@solefit.com / sales123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
