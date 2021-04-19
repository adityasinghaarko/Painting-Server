const express = require('express')
require('dotenv').config()
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs-extra')
const fileUpload = require('express-fileupload')
const ObjectId = require('mongodb').ObjectId;

// const admin = require('firebase-admin');
// var serviceAccount = require("./book-passage-firebase-adminsdk-g8fdb-d75dcf898e.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qk4l2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express()
const port = 5000;

app.use(bodyParser.json())
app.use(cors())
app.use(express.static('serviceImages'));
app.use(fileUpload())




client.connect(err => {
  const reviewssCollection = client.db("painting").collection("reviews");
  const admins = client.db("painting").collection("admins");
  const servicesCollection = client.db("painting").collection("services");

  app.get('/reviews', (req, res) => {
    reviewssCollection.find()
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/services', (req, res) => {
    servicesCollection.find()
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/checkAdmin', (req, res) => {
    const email = req.query.email;
    admins.find({ email: email })
      .toArray((err, docs) => {
        res.send(docs.length > 0);
      })
  })

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

  app.get('/addAdmin', (req, res) => {
    const email = req.headers.email;
    console.log(email);
    admins.insertOne({email: email})
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })


});


app.listen(process.env.PORT || port)
