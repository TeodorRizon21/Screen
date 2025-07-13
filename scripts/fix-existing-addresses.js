const { MongoClient } = require('mongodb');

async function fixExistingAddresses() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const orderDetailsCollection = db.collection('OrderDetails');

    // Găsim toate documentele care au "Strada" în numele străzii
    const documentsToUpdate = await orderDetailsCollection.find({
      street: { $regex: /^Strada\s+/i }
    }).toArray();

    console.log(`Found ${documentsToUpdate.length} documents to update`);

    for (const doc of documentsToUpdate) {
      console.log(`Processing document ${doc._id}: "${doc.street}"`);
      
      // Extragem numele străzii fără "Strada"
      const streetName = doc.street.replace(/^Strada\s+/i, '').trim();
      
      // Extragem numărul străzii din numele străzii
      const streetMatch = streetName.match(/\d+/);
      const streetNumber = streetMatch ? streetMatch[0] : '1';
      
      // Numele străzii fără număr
      const cleanStreetName = streetName.replace(/\d+.*$/, '').trim();
      
      // Actualizăm documentul
      await orderDetailsCollection.updateOne(
        { _id: doc._id },
        {
          $set: {
            street: cleanStreetName,
            streetNumber: streetNumber,
            block: doc.block || null,
            floor: doc.floor || null,
            apartment: doc.apartment || null
          }
        }
      );

      console.log(`Updated: "${doc.street}" -> street: "${cleanStreetName}", streetNumber: "${streetNumber}"`);
    }

    console.log('All existing addresses have been updated successfully');
  } catch (error) {
    console.error('Error updating addresses:', error);
  } finally {
    await client.close();
  }
}

// Rulăm scriptul
fixExistingAddresses(); 