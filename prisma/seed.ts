import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPin = await hash("123456", 10);

  await prisma.employee.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Administrador",
      username: "admin",
      pinHash: adminPin,
      role: "ADMIN",
    },
  });

  const categories = [
    { name: "Bebidas", color: "#3b82f6" },
    { name: "Snacks", color: "#f59e0b" },
    { name: "Abarrotes", color: "#22c55e" },
    { name: "Limpieza", color: "#06b6d4" },
    { name: "Varios", color: "#a855f7" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const paymentMethods = [
    { name: "Efectivo", type: "CASH" as const },
    { name: "QR / Transferencia", type: "DIGITAL" as const },
    { name: "Tarjeta", type: "DIGITAL" as const },
  ];

  for (const pm of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: pm.name },
      update: {},
      create: pm,
    });
  }

  // Desactivar métodos viejos que ya no se usan
  await prisma.paymentMethod.updateMany({
    where: { name: { in: ["Débito", "Crédito"] } },
    data: { isActive: false },
  });

  const products = [
  // 🥤 BEBIDAS
  { name: "Coca Cola 500ml", price: 1200, costPrice: 800, categoryName: "Bebidas", stock: { quantity: 50, minStock: 10 } },
  { name: "Coca Cola 1.5L", price: 2200, costPrice: 1600, categoryName: "Bebidas", stock: { quantity: 30, minStock: 8 } },
  { name: "Pepsi 500ml", price: 1100, costPrice: 750, categoryName: "Bebidas", stock: { quantity: 40, minStock: 10 } },
  { name: "Sprite 500ml", price: 1100, costPrice: 750, categoryName: "Bebidas", stock: { quantity: 35, minStock: 10 } },
  { name: "Fanta 500ml", price: 1100, costPrice: 750, categoryName: "Bebidas", stock: { quantity: 35, minStock: 10 } },
  { name: "Agua Mineral 500ml", price: 700, costPrice: 400, categoryName: "Bebidas", stock: { quantity: 60, minStock: 15 } },
  { name: "Agua Mineral 1.5L", price: 1200, costPrice: 800, categoryName: "Bebidas", stock: { quantity: 40, minStock: 10 } },
  { name: "Jugo Cepita 1L", price: 1800, costPrice: 1300, categoryName: "Bebidas", stock: { quantity: 25, minStock: 8 } },
  { name: "Speed 250ml", price: 1500, costPrice: 1100, categoryName: "Bebidas", stock: { quantity: 30, minStock: 10 } },
  { name: "Monster 473ml", price: 2000, costPrice: 1500, categoryName: "Bebidas", stock: { quantity: 20, minStock: 5 } },

  // 🍪 SNACKS
  { name: "Papas Lays Clásicas", price: 1500, costPrice: 1000, categoryName: "Snacks", stock: { quantity: 25, minStock: 8 } },
  { name: "Papas Lays BBQ", price: 1500, costPrice: 1000, categoryName: "Snacks", stock: { quantity: 20, minStock: 8 } },
  { name: "Doritos", price: 1600, costPrice: 1100, categoryName: "Snacks", stock: { quantity: 20, minStock: 6 } },
  { name: "Cheetos", price: 1400, costPrice: 950, categoryName: "Snacks", stock: { quantity: 20, minStock: 6 } },
  { name: "Maní Salado 100g", price: 900, costPrice: 600, categoryName: "Snacks", stock: { quantity: 30, minStock: 10 } },
  { name: "Palitos Salados", price: 800, costPrice: 500, categoryName: "Snacks", stock: { quantity: 30, minStock: 10 } },

  // 🍫 GOLOSINAS
  { name: "Chocolate Milka", price: 1800, costPrice: 1300, categoryName: "Snacks", stock: { quantity: 15, minStock: 5 } },
  { name: "Kinder Bueno", price: 2200, costPrice: 1700, categoryName: "Snacks", stock: { quantity: 10, minStock: 4 } },
  { name: "Bon o Bon", price: 500, costPrice: 300, categoryName: "Snacks", stock: { quantity: 50, minStock: 15 } },
  { name: "Turrón Arcor", price: 600, costPrice: 350, categoryName: "Snacks", stock: { quantity: 40, minStock: 10 } },
  { name: "Chicle Beldent", price: 700, costPrice: 400, categoryName: "Snacks", stock: { quantity: 35, minStock: 10 } },

  // 🍝 ABARROTES
  { name: "Arroz 1kg", price: 1700, costPrice: 1200, categoryName: "Abarrotes", stock: { quantity: 25, minStock: 5 } },
  { name: "Fideos Spaghetti", price: 1000, costPrice: 700, categoryName: "Abarrotes", stock: { quantity: 30, minStock: 5 } },
  { name: "Fideos Tirabuzón", price: 1000, costPrice: 700, categoryName: "Abarrotes", stock: { quantity: 30, minStock: 5 } },
  { name: "Harina 1kg", price: 900, costPrice: 600, categoryName: "Abarrotes", stock: { quantity: 35, minStock: 8 } },
  { name: "Azúcar 1kg", price: 1200, costPrice: 850, categoryName: "Abarrotes", stock: { quantity: 30, minStock: 8 } },
  { name: "Yerba Mate 1kg", price: 4000, costPrice: 3200, categoryName: "Abarrotes", stock: { quantity: 20, minStock: 5 } },
  { name: "Café Instantáneo", price: 3500, costPrice: 2700, categoryName: "Abarrotes", stock: { quantity: 15, minStock: 5 } },
  { name: "Leche Larga Vida", price: 1400, costPrice: 1000, categoryName: "Abarrotes", stock: { quantity: 25, minStock: 10 } },
  { name: "Aceite Girasol 1.5L", price: 3000, costPrice: 2400, categoryName: "Abarrotes", stock: { quantity: 20, minStock: 5 } },
  { name: "Sal Fina", price: 700, costPrice: 400, categoryName: "Abarrotes", stock: { quantity: 25, minStock: 5 } },

  // 🧼 LIMPIEZA
  { name: "Lavandina 1L", price: 1200, costPrice: 800, categoryName: "Limpieza", stock: { quantity: 20, minStock: 5 } },
  { name: "Detergente 750ml", price: 1400, costPrice: 1000, categoryName: "Limpieza", stock: { quantity: 20, minStock: 5 } },
  { name: "Jabón en Polvo 800g", price: 2800, costPrice: 2200, categoryName: "Limpieza", stock: { quantity: 15, minStock: 5 } },
  { name: "Suavizante 900ml", price: 2000, costPrice: 1500, categoryName: "Limpieza", stock: { quantity: 15, minStock: 5 } },
  { name: "Esponja Cocina", price: 600, costPrice: 300, categoryName: "Limpieza", stock: { quantity: 40, minStock: 10 } },
  { name: "Rollo Cocina", price: 1200, costPrice: 800, categoryName: "Limpieza", stock: { quantity: 30, minStock: 10 } },
  { name: "Papel Higiénico x4", price: 2500, costPrice: 1900, categoryName: "Limpieza", stock: { quantity: 20, minStock: 5 } },

  // 🧴 VARIOS
  { name: "Shampoo 400ml", price: 2500, costPrice: 1900, categoryName: "Varios", stock: { quantity: 15, minStock: 5 } },
  { name: "Acondicionador 400ml", price: 2500, costPrice: 1900, categoryName: "Varios", stock: { quantity: 15, minStock: 5 } },
  { name: "Desodorante Axe", price: 2200, costPrice: 1700, categoryName: "Varios", stock: { quantity: 20, minStock: 5 } },
  { name: "Cepillo de Dientes", price: 1200, costPrice: 800, categoryName: "Varios", stock: { quantity: 25, minStock: 5 } },
  { name: "Pasta Dental", price: 1800, costPrice: 1300, categoryName: "Varios", stock: { quantity: 20, minStock: 5 } }
];

for (const p of products) {
  const category = await prisma.category.findUnique({
    where: { name: p.categoryName },
  });

  if (!category) continue;

  const existing = await prisma.product.findFirst({ where: { name: p.name } });

  const product = existing
    ? await prisma.product.update({
        where: { id: existing.id },
        data: { price: p.price, costPrice: p.costPrice, categoryId: category.id },
      })
    : await prisma.product.create({
        data: { name: p.name, price: p.price, costPrice: p.costPrice, categoryId: category.id },
      });

  await prisma.stock.upsert({
    where: { productId: product.id },
    update: { quantity: p.stock.quantity, minStock: p.stock.minStock },
    create: { productId: product.id, quantity: p.stock.quantity, minStock: p.stock.minStock },
  });
}

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });