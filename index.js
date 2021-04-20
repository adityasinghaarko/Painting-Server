const express = require('express')
require('dotenv').config()
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs-extra')
const fileUpload = require('express-fileupload')
const ObjectId = require('mongodb').ObjectId;

const admin = require('firebase-admin');
var serviceAccount = require("./painting-8a9fd-firebase-adminsdk-nmmmo-ba08073fec.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qk4l2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express()
const port = 5000;

app.use(bodyParser.json())
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('serviceImages'));
app.use(fileUpload())




client.connect(err => {
  const reviewsCollection = client.db("painting").collection("reviews");
  const admins = client.db("painting").collection("admins");
  const servicesCollection = client.db("painting").collection("services");
  const bookingsCollection = client.db("painting").collection("bookings");



  //method: GET
  app.get('/reviews', (req, res) => {
    reviewsCollection.find()
      .toArray((err, documents) => {
        res.send(documents);
      })
  })


  app.get('/bookings', (req, res) => {
    const queryEmail = req.query.email;
    const idToken = req.headers.authorization;

    admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          if (tokenEmail === queryEmail) {
            bookingsCollection.find({ email: queryEmail })
              .toArray((errors, documents) => {
                res.send(documents)
              })
          }
          // ...
        })
        .catch((error) => {
          // Handle error
        });
  })



  app.get('/services', (req, res) => {
    servicesCollection.find()
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/service/:serviceId', (req, res) => {
    const serviceId = req.params.serviceId;
    servicesCollection.find({ _id: ObjectId(`${serviceId}`)})
    .toArray((error, documents) => {
      res.send(documents);
    })
  })

  app.get('/addAdmin', (req, res) => {
    const email = req.headers.email;
    console.log(email);
    admins.insertOne({ email: email })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.get('/checkAdmin', (req, res) => {
    const email = req.query.email;
    admins.find({ email: email })
      .toArray((err, docs) => {
        res.send(docs.length > 0);
      })
  })
  //method: GET


  // method:POST
  app.post('/addService', (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const serviceType = req.body.serviceType;
    const description = req.body.description;
    const budget = req.body.budget;
    const filePath = `${__dirname}/serviceImages/${file.name}`;

    file.mv(filePath, (error) => {
      if (error) {
        console.log(error);
        res.status(500).send({ msg: "failed to upload image in the server" })
      }

      const newImage = fs.readFileSync(filePath);
      const encImage = newImage.toString('base64');

      const image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer(encImage, 'base64')
      }

      servicesCollection.insertOne({ title, serviceType, description, budget, image })
        .then(result => {
          fs.remove(filePath, err => {
            res.send(result.insertedCount > 0)
          })
        })
    })
  })

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    console.log(req.body)
    bookingsCollection.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0)
      })

  })

  app.post("/addReview", (req, res) => {
    const newReview = req.body;
    reviewsCollection.insertOne(newReview)
      .then(result => {
        res.send(result.insertedCount > 0)
      })

  })
  // method:POST

  
  // method:DELETE
  app.delete('/deleteService/:serviceId', (req, res) => {
    const serviceId = req.params.serviceId
    console.log(serviceId)
    servicesCollection.findOneAndDelete({ _id: ObjectId(`${serviceId}`) })
      .then(result => {
        if (result.value) {
          res.send(true)
        }
      })
  })
  //  method:DELETE
});


app.listen(process.env.PORT || port)
