const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express()
const port=process.env.PORT || 5000;

// middleWere
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.okjp9zn.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    // to get the value in client 
    const carCollection = client.db("carDoctor").collection("services");
    const checkOutCollection=client.db("carDoctor").collection("checkOut")


    app.get('/service',async(req,res)=>{
      const cursor = carCollection.find();
        const result=await cursor.toArray()
         res.send(result)
    })
    // app.get ('/hello',async(req,res)=>{
    //   console.log("hello");
    // })


    // get checkout service
    app.get(`/services/:id`,async(req,res)=>{
      const id=req.params.id
      const query={_id : new ObjectId(id)}
      const options = {
        
        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1, price: 1, service_id: 1 ,img:1 },
      };
      const result=await carCollection.findOne(query,options)
      res.send(result)
    })

    // checkOut find Some
   app.get('/checkOut',async(req,res)=>{
    console.log(req.query.email);
    let query={}
    if(req.query?.email){
      query={email:req.query.email}
    }
    const result=await checkOutCollection.find(query).toArray()
    res.send(result)
   })
    // CheckOut insert one
    app.post('/checkOut',async(req,res)=>{
      const booking=req.body
      console.log(booking);
      const result=await checkOutCollection.insertOne(booking)
      res.send(result)

    })
    // update one Status
    app.patch('/checkOut/:id',async(req,res)=>{
      const id =req.params.id;
      const filter={_id : new ObjectId(id)}
      const updateCheckOut=req.body;
      const updateDoc = {
        $set: {
          status: updateCheckOut.status
        },
      };
      const result=await checkOutCollection.updateOne(filter,updateDoc)
      res.send(result)
    })
    
    // delete items
    app.delete('/checkOut/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id : new ObjectId(id)}
      const result=await checkOutCollection.deleteOne(query)
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('doctor is runnig')
})
app.listen(port,()=>{
    console.log(`the surver is running on port ${port}`);
})