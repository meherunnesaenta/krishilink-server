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




app.listen(port, () => {
  console.log(`Server app listening on port ${port}`)
})
