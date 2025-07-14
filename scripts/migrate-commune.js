const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateCommuneFields() {
  try {
    console.log('Încep migrarea pentru câmpurile commune și locationType...');

    // Verificăm dacă câmpurile există deja
    const existingOrderDetails = await prisma.orderDetails.findFirst();
    
    if (existingOrderDetails) {
      console.log('Găsite detalii comenzi existente. Verificăm structura...');
      
      // Încercăm să accesăm câmpurile noi pentru a vedea dacă există
      try {
        const testQuery = await prisma.orderDetails.findFirst({
          select: {
            id: true,
            commune: true,
            locationType: true
          }
        });
        console.log('✅ Câmpurile commune și locationType există deja în baza de date.');
        return;
      } catch (error) {
        console.log('❌ Câmpurile commune și locationType nu există încă. Continuăm cu migrarea...');
      }
    }

    // Dacă ajungem aici, înseamnă că trebuie să rulăm migrarea
    console.log('Rulăm migrarea pentru a adăuga câmpurile commune și locationType...');
    
    // Pentru MongoDB, trebuie să actualizăm manual documentele
    // Vom seta valori default pentru comenzile existente
    const result = await prisma.orderDetails.updateMany({
      where: {
        OR: [
          { commune: null },
          { locationType: null }
        ]
      },
      data: {
        commune: null,
        locationType: 'city'
      }
    });

    console.log(`✅ Migrare completă! Actualizate ${result.count} înregistrări.`);
    console.log('Câmpurile commune și locationType au fost adăugate cu succes.');

  } catch (error) {
    console.error('❌ Eroare la migrare:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Rulăm migrarea
migrateCommuneFields()
  .then(() => {
    console.log('🎉 Migrarea s-a finalizat cu succes!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Eroare la migrare:', error);
    process.exit(1);
  }); 