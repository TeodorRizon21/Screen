const { MongoClient } = require('mongodb');

async function testDPDFix() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const orderDetailsCollection = db.collection('OrderDetails');

    // Găsim o comandă cu "Strada Astrelor" pentru a o actualiza
    const orderDetail = await orderDetailsCollection.findOne({
      street: { $regex: /Strada Astrelor/i }
    });

    if (orderDetail) {
      console.log('Found order detail to update:', orderDetail._id);
      console.log('Current street:', orderDetail.street);
      
      // Actualizăm cu noile câmpuri
      await orderDetailsCollection.updateOne(
        { _id: orderDetail._id },
        {
          $set: {
            street: 'Astrelor',
            streetNumber: '57',
            block: null,
            floor: null,
            apartment: null
          }
        }
      );

      console.log('Updated order detail with new address fields');
      
      // Verificăm actualizarea
      const updatedOrderDetail = await orderDetailsCollection.findOne({ _id: orderDetail._id });
      console.log('Updated street:', updatedOrderDetail.street);
      console.log('Street number:', updatedOrderDetail.streetNumber);
    } else {
      console.log('No order detail found with "Strada Astrelor"');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Rulăm testul
testDPDFix(); 