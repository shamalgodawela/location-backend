const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv= require("dotenv").config();
const app = express();
const port = 8000;
const cors = require('cors');


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors({
  origin: ["http://localhost:3000", "https://location-tracking-admin-ten.vercel.app"], // Allowed frontends
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, 
}));



app.get("/", (req, res)=>{
  res.json({message:'hello word from backend'})

});


const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.log("Error connecting to MongoDB", err);
});

app.listen(port, () => {
  console.log('Server running on port 8000');
});

const User = require("./models/user");
const Location=require("./models/Location")
const admin=require("./models/admin")

//user registration---------------------------------------------------------------------------------

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

 
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });


    await newUser.save();

    res.status(200).json({ message: 'User registered successfully' });

  } catch (error) {
    console.log("Error registering user", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// admin registration
app.post("/admin-register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await admin.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

 
    const hashedPassword = await bcrypt.hash(password, 10);

    const newadmin = new admin({
      name,
      email,
      password: hashedPassword,
    });


    await newadmin.save();

    res.status(200).json({ message: 'admin registered successfully' });

  } catch (error) {
    console.log("Error registering user", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// user login------------------------------------------------------------------------------------------

app.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
  
    
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
     
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        'your_jwt_secret_key', 
        { expiresIn: '9h' } 
      );

      
      res.status(200).json({ message: 'Login successful', token,userId: user._id });
      
  
    } catch (error) {
      console.log("Error logging in user", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
// admin login------------------------------------------------------------------------------------------

app.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await admin.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

  
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create a JWT token
    const token = jwt.sign(
      { adminId: admin._id, email: admin.email },
      'your_jwt_secret_key', // Replace with your own secret key
      { expiresIn: '1h' } // Token expiration time (1 hour)
    );

    
    res.status(200).json({ message: 'Login successful', token,userId: user._id });
    

  } catch (error) {
    console.log("Error logging in user", error);
    res.status(500).json({ message: "Login failed" });
  }
});

//save location--------------------------------------------------------------------------------------------

  app.post('/save-location', async (req, res) => {
    console.log('Request Body:', req.body); // Debug log
  
    const { userId, latitude, longitude } = req.body;
  
    if (!userId || !latitude || !longitude) {
      console.error('Missing required fields:', { userId, latitude, longitude });
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      const location = new Location({ userId, latitude, longitude });
      await location.save();
      res.status(200).send({ message: 'Location saved successfully!' });
    } catch (error) {
      console.error('Error saving location:', error);
      res.status(500).send({ error: 'Failed to save location' });
    }
  });
  

  app.post('/stop-location-tracking', (req, res) => {
    const { userId } = req.body;
    console.log(`Tracking stopped for user: ${userId}`);
    res.status(200).send({ message: 'Tracking stopped successfully' });
  });

  //get location specific date ----------------------------------------------------------
  app.get('/filter-locations', async (req, res) => {
    const { userId, date } = req.query;

    if (!userId || !date) {
        return res.status(400).send({ error: 'User ID and date are required' });
    }

    try {
        // Parse the provided date to get the start and end of the day
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        // Query the location database
        const locations = await Location.find({
            userId: userId,
            timestamp: {
                $gte: startDate,
                $lte: endDate,
            },
        });

        res.status(200).send({ locations });
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).send({ error: 'Failed to fetch location data' });
    }
});
