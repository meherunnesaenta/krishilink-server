const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 3000
console.log(process.env);

const admin = require("firebase-admin");

const serviceAccount = require("./krishilink-firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


app.use(express.json());
app.use(cors());

const logger = (req, res, next) => {
  console.log(`${req.method} ${req.path} at ${new Date().toISOString()}`);
  next();
}

const verifyFirebaseToken = async (req, res, next) => {
  console.log('Verifying Firebase token...', req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }

  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    req.user = userInfo;
    console.log('after token verification', userInfo);
    next();
  }
  catch {
    return res.status(401).send({ message: 'Unauthorized access' });
  }

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.chnqfjs.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version


app.get('/', (req, res) => {
  res.send('server is running fine !')
})
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db('krishLink');
    const modelCollection = db.collection('card');
    const interestCollection = db.collection('interest');
    const usersCollection = db.collection('user');



    app.get('/latest-products', async (req, res) => {
      const cursor = modelCollection.find().sort({ pricePerUnit: 1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/card', async (req, res) => {
      const result = await modelCollection.find().toArray()
      res.send(result);
    })


app.patch('/interest/:id/status', verifyFirebaseToken, async (req, res) => {
  console.log("=== Accept/Reject Request Started ===");
  console.log("Interest ID:", req.params.id);
  console.log("New Status:", req.body.status);
  console.log("Logged in user email:", req.user?.email);

  const { id } = req.params;
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    console.log("Invalid status");
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    console.log("Step 1: Finding interest...");
    const interest = await interestCollection.findOne({ _id: new ObjectId(id) });

    if (!interest) {
      console.log("Interest NOT FOUND");
      return res.status(404).json({ success: false, message: 'Interest not found' });
    }
    console.log("Interest found:", interest._id, "cropId:", interest.cropId);

    console.log("Step 2: Finding crop...");
    const crop = await modelCollection.findOne({ _id: new ObjectId(interest.cropId) });

    if (!crop) {
      console.log("CROP NOT FOUND with cropId:", interest.cropId);
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }
    console.log("Crop found. Owner email:", crop.owner?.ownerEmail);

    console.log("Step 3: Checking ownership...");
    if (crop.owner?.ownerEmail !== req.user.email) {
      console.log("FORBIDDEN: User", req.user.email, "is not owner", crop.owner?.ownerEmail);
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    console.log("Ownership verified");

    console.log("Step 4: Updating status...");
    const result = await interestCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status } }
    );

    console.log("Update result:", result);

    if (result.modifiedCount > 0) {
      console.log("SUCCESS: Status updated to", status);
      res.json({ success: true, message: `Interest ${status} successfully` });
    } else {
      console.log("No change made");
      res.status(400).json({ success: false, message: 'Failed to update' });
    }
  } catch (error) {
    console.error("FATAL ERROR:", error);  // এটা দেখো!
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


app.patch('/card/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const result = await modelCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    res.send({
      success: result.modifiedCount > 0,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Update failed' });
  }
});



app.delete('/card/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await modelCollection.deleteOne({
      _id: new ObjectId(id)
    });

    res.send({
      success: result.deletedCount > 0,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Delete failed' });
  }
});



    app.patch("/users/:email", async (req, res) => {
      const email = req.params.email;
      const updatedInfo = req.body;

      const result = await usersCollection.updateOne(
        { email },
        { $set: updatedInfo }
      );

      res.send(result);
    });



    app.post('/card', async (req, res) => {
      const data = req.body
      console.log(data)
      const result = await modelCollection.insertOne(data)
      res.send({
        success: true
      })

    })



    app.get('/interest', logger, verifyFirebaseToken, async (req, res) => {

      console.log('headers', req.headers);
      const query = {};
      if (query.email) {
        query.buyer_email = email;
      }

      const cursor = interestCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })


    app.get('/myposts', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send({ message: 'Email is required' });
        }
        const result = await modelCollection.find({ "owner.ownerEmail": email }).sort({ createdAt: -1 }).toArray();
        res.send(result);
      }
      catch (error) {
        console.error('Error fetching crops:', error);
        res.status(500).send({ message: 'Server error' });
      }
    });

app.post('/interest', async (req, res) => {
  const data = req.body;
  const result = await interestCollection.insertOne(data);
  res.send({
    success: true,
    result: { ...data, _id: result.insertedId } 
  });
});

app.get('/card/interest/:productId', logger, verifyFirebaseToken, async (req, res) => {
  const productId = req.params.productId;
  const cursor = interestCollection.find({ cropId: productId }).sort({ price: -1 });
  const result = await cursor.toArray();
  res.send(result);
});

    app.get('/card/:id', async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const result = await modelCollection.findOne({ _id: objectId });

      res.send({
        success: true,
        result

      })
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => {
  console.log(`Server app listening on port ${port}`)
})
