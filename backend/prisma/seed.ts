import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log('Products already exist, skipping seed.');
    return;
  }

  const defaultProducts = [
    {
      name: 'Pizza',
      category: 'Food & Cafe',
      price: 150,
      stock: 50,
      weight: '1 piece',
      description: 'Delicious cheese pizza',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400&h=400'
    },
    {
      name: 'Samosa',
      category: 'Snacks & Drinks',
      price: 20,
      stock: 100,
      weight: '2 pieces',
      description: 'Crispy potato stuffed samosa',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400&h=400'
    },
    {
      name: 'Burger',
      category: 'Food & Cafe',
      price: 80,
      stock: 40,
      weight: '1 piece',
      description: 'Veggie burger with cheese',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400&h=400'
    },
    {
      name: 'Cold Coffee',
      category: 'Snacks & Drinks',
      price: 60,
      stock: 30,
      weight: '1 glass',
      description: 'Refreshing cold coffee',
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400&h=400'
    },
    {
      name: 'Pencil',
      category: 'Stationary',
      price: 5,
      stock: 200,
      weight: '1 piece',
      description: 'HB Pencil',
      imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=400&h=400'
    },
    {
      name: 'Notebook',
      category: 'Stationary',
      price: 50,
      stock: 100,
      weight: '1 piece',
      description: 'Ruled notebook 200 pages',
      imageUrl: 'https://images.unsplash.com/photo-1531346878377-a541e4ab0c16?auto=format&fit=crop&q=80&w=400&h=400'
    }
  ];

  for (const p of defaultProducts) {
    await prisma.product.create({
      data: p
    });
  }
  console.log('Database seeded with default products.');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
