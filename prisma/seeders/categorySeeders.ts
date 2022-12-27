import { Prisma, PrismaClient } from '@prisma/client';

const shift_karvado_data = {
  Furniture: [
    'Bar Furniture',
    'Bed/Mattress',
    'Cabinet & Storage',
    'Chair',
    'Kitchen Furniture',
    'Dining ',
    'Sofa',
    'Table',
  ],
  'Large Appliances': [
    'Air Conditioner',
    'Refrigerator',
    'Television',
    'Washing Machine',
  ],
  'Small Appliances': ['General Appliance', 'Kitchen Appliance'],
  'Kitchen Items': ['Kitchen Item'],
  'Smaller/Loose Items': [
    'Suitcase',
    'Clothes & Shoes',
    'Decorative Item',
    'Files & Stationery',
    'Books',
    'Bedding',
    'Carton',
    'House Keeping',
    'Toys',
  ],
  'Misc.': [
    'Gym equipment',
    'Kids Vehicle',
    'Lamp & Lighting',
    'Bicycle',
    'Fire Extinguisher',
    'Musical Instruments',
  ],
  'IT Equipments': ['IT Equipment'],
};

const categorySeeders = async (
  prisma: PrismaClient<
    Prisma.PrismaClientOptions,
    never,
    Prisma.RejectOnNotFound | Prisma.RejectPerOperation
  >,
) => {
  const user = await prisma.user.findUnique({
    where: {
      email: 'testadmin@gmail.com',
    },
  });

  for (const categoryName in shift_karvado_data) {
    if (
      Object.prototype.hasOwnProperty.call(shift_karvado_data, categoryName)
    ) {
      const sub_category: string[] = shift_karvado_data[categoryName];
      const category = await prisma.category.create({
        data: {
          name: categoryName.toLowerCase(),
          userId: user.id,
        },
      });

      for (const subCategoryName of sub_category) {
        await prisma.category.create({
          data: {
            name: subCategoryName.toLowerCase(),
            userId: user.id,
            parentCategoryId: category.id,
          },
        });
      }
    }
  }
};

export default categorySeeders;
