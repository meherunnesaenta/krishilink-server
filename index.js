const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT || 3000


app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('server is running fine !')
})




const uri = "mongodb+srv://krishLink:YseQ887zpb7wsF8n@cluster0.chnqfjs.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
    const interestCollection =db.collection('interest');



    app.get('/latest-products', async (req, res) => {
      const cursor = modelCollection.find().sort({pricePerUnit:1}).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/card', async (req, res) => {
      const result = await modelCollection.find().toArray()
      res.send(result);
    })


    app.post('/card', async (req, res) => {
      const data = req.body
      console.log(data)
      const result = await modelCollection.insertOne(data)
      res.send({
        success: true
      })

    })
    app.get('/interest', async (req, res) => {
      const result = await interestCollection.find().toArray()
      res.send(result);
    })


    app.post('/interest', async (req, res) => {
      const data = req.body
      console.log(data)
      const result = await interestCollection.insertOne(data)
      res.send({
        success: true
      })

    })

    app.get('/card/interest/:productId',async(req,res)=>{
      const productId =req.params.productId;
      const query ={product: productId}
      const cursor =interestCollection.find(query).sort({price:-1})
      const result =await cursor.toArray();
      res.send(result);
    })

    app.get('/card/:id', async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
     const result = await modelCollection.findOne({ _id: id });

      res.send({
        success: true,
        result

      })
    })


    //  fetch('',{
    //    method: 'POST',
    //    headers:{
    //     "Content-Type":"application/json",
    //    },
    //    body:JSON.stringify(FormData)
    //  })
    //  .then(res=>res.json())
    //  .then(data=>{
    //   console.log(data)
    //  })
    //  .catch(err=>{
    //   console.log(err)
    //  })


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
