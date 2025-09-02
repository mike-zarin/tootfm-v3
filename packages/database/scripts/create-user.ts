import { prisma } from '../src/index';

async function main() {
  const user = await prisma.user.create({
    data: {
      id: 'google_user_1',
      email: 'mihail.zarin@gmail.com', // Замени на свой реальный email
      name: 'Mike Zarin',
      image: null
    }
  });
  
  console.log('Created user:', user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
