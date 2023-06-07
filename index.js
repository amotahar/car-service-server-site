const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;



// middle wares
app.use(cors());
app.use(express.json());



// this is from the Mongodb.
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vfeao8o.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt
function verifyJWT(req, res, next) {
   const authHeader = req.headers.authorization;

   if (!authHeader) {
      return res.status(401).send({ message: 'unauthorized access' });
   }
   const token = authHeader.split(' ')[1];

   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
         return res.status(403).send({ message: 'Forbidden access' });
      }
      req.decoded = decoded;
      next();
   })
}




//Crud operation start--

async function run() {
   try {
      const serviceCollection = client.db('geniusCar').collection('services');

      //orders api---
      const orderCollection = client.db('geniusCar').collection('orders');




      app.post('/jwt', (req, res) => {
         const user = req.body;
         const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
         res.send({ token })
      })


      // database ar services gulo ak sathe paoya ---
      app.get('/services', async (req, res) => {
         const query = {}
         const cursor = serviceCollection.find(query);
         const services = await cursor.toArray();
         res.send(services);
      });






      // specific service get api ---(( ID ))

      app.get('/services/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) };
         const service = await serviceCollection.findOne(query);
         res.send(service);
      });



      // orders api
      app.get('/orders', verifyJWT, async (req, res) => {
         // const decoded = req.decoded;
         // console.log('inside orders api', decoded)

         // if (decoded.email !== req.query.email) {
         //    res.status(403).send({ message: 'unauthorized access' })
         // }

         let query = {};

         if (req.query.email) {
            query = {
               email: req.query.email
            }
         }

         const cursor = orderCollection.find(query);
         const orders = await cursor.toArray();
         res.send(orders);
      });

      app.post('/orders', verifyJWT, async (req, res) => {
         const order = req.body;
         const result = await orderCollection.insertOne(order);
         res.send(result);
      });



      //Update api
      app.patch('/orders/:id', verifyJWT, async (req, res) => {
         const id = req.params.id;
         const status = req.body.status
         const query = { _id: new ObjectId(id) }
         const updatedDoc = {
            $set: {
               status: status
            }
         }
         const result = await orderCollection.updateOne(query, updatedDoc);
         res.send(result);
      })





      //Delete Api
      app.delete('/orders/:id', verifyJWT, async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) };
         const result = await orderCollection.deleteOne(query);
         res.send(result);
      })






   }
   finally {

   }

}

run().catch(err => console.error(err));


app.get('/', (req, res) => {
   res.send('genius car server is running')
})

app.listen(port, () => {
   console.log(`Genius Car server running on ${port}`);
})