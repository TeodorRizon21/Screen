const { MongoClient } = require('mongodb');

async function migrateAddressFields() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const orderDetailsCollection = db.collection('OrderDetails');

    // Găsim toate documentele OrderDetails care nu au câmpul streetNumber
    const documentsToUpdate = await orderDetailsCollection.find({
      streetNumber: { $exists: false }
    }).toArray();

    console.log(`Found ${documentsToUpdate.length} documents to migrate`);

    for (const doc of documentsToUpdate) {
      // Extragem numărul străzii din câmpul street
      const streetMatch = doc.street.match(/\d+/);
      const streetNumber = streetMatch ? streetMatch[0] : '1';
      
      // Extragem numele străzii fără număr
      const streetName = doc.street.replace(/\d+.*$/, '').trim();
      
      // Actualizăm documentul
      await orderDetailsCollection.updateOne(
        { _id: doc._id },
        {
          $set: {
            street: streetName,
            streetNumber: streetNumber,
            block: null,
            floor: null,
            apartment: null
          }
        }
      );

      console.log(`Migrated document ${doc._id}: "${doc.street}" -> street: "${streetName}", streetNumber: "${streetNumber}"`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Rulăm migrația
migrateAddressFields(); 