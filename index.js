const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParse=require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app=express()
const port=process.env.PORT || 5000;

// middleWere
app.use(cors({
  origin:["http://localhost:5173"],
  credentials:true
}));
app.use(express.json());
app.use(cookieParse())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.okjp9zn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// create middeleweres
const logger=async(req,res,next)=>{
  console.log("called",req.host, req.originalUrl)
  next()
}

// 
const validateToken=async(req,res,next)=>{
  const token=req.cookies?.token
  console.log('value of token in middle were',token);
  if(!token){
    return res.status(401).send({message: "not authorized"})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      console.log(err);
      return res.status(401).send({message : "unauthorized"})
      
    }
    console.log("value in token",decoded);
    req.user=decoded
    next()
  })
  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // to get the value in client 
    const carCollection = client.db("carDoctor").collection("services");
    const checkOutCollection=client.db("carDoctor").collection("checkOut")
    // Auth related api
    app.post('/jwt',async(req,res)=>{
      const user=req.body
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn : '1h'})
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', 
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          
      })
        .send({success:true})
    })



    // service related api
    app.get('/service',logger, async(req,res)=>{
      const cursor = carCollection.find();
        const result=await cursor.toArray()
         res.send(result)
    })
    // app.get ('/hello',async(req,res)=>{
    //   console.log("hello");
    // })


    // get checkout service
    app.get(`/services/:id`,logger, async(req,res)=>{
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
   app.get('/checkOut',logger, validateToken, async(req,res)=>{
    console.log(req.query.email);
   console.log('user valid token',req.user);
   if(req.query?.email !== req.user.email){
    return res.status(403).send ({message:"forbidden access"})
   }
    let query={}
    if(req.query?.email){
      query={email:req.query.email}
    }
    const result=await checkOutCollection.find(query).toArray()
    res.send(result)
   })
    // CheckOut insert one
    app.post('/checkOut',logger, async(req,res)=>{
      const booking=req.body
      console.log(booking);
      const result=await checkOutCollection.insertOne(booking)
      res.send(result)

    })
    // update one Status
    app.patch('/checkOut/:id',logger, async(req,res)=>{
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
    app.delete('/checkOut/:id',logger, async(req,res)=>{
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