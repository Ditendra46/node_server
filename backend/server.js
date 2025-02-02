require('dotenv').config(); // Load environment variables
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

const { createClient } = require('@supabase/supabase-js');

// Access environment variables
const supabaseUrl = "https://abmlsxqdjuecwaufbkeb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibWxzeHFkanVlY3dhdWZia2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3OTcwNDAsImV4cCI6MjA1MzM3MzA0MH0._kVeEdv6D3JlmkbI5lLrtkUBAw8o0NeOXMKVbuGcPgo";


const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.use(cors({
  origin: 'https://bikerental-delta.vercel.app' // Replace with your Netlify URL
}));
app.use(express.json());
app.use(bodyParser.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(null, 'product-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(uploadsDir)); // Serve images from uploads directory

// Create product endpoint
app.post('/api/products', upload.single('image'), async (req, res) => {
  const { name, description, price, category } = req.body;
  const imageUrl = req.file ? `https://bikerental-delta.vercel.app/uploads/${req.file.filename}` : null;

  const { data, error } = await supabase
    .from('products') // Ensure this table exists in Supabase
    .insert([{ name, description, price, category, image_url: imageUrl }]);

  if (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Error creating product' });
  }
  res.status(201).json({ message: 'Product created successfully'});
});

// Get products endpoint
app.get('/api/products', async (req, res) => {
  const { data, error } = await supabase
    .from('car_details') // Ensure this table exists in Supabase
    .select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user details into the users table
      const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      connection.query(query, [username, email, hashedPassword], (error, results) => {
          if (error) {
              console.error('Error inserting user:', error); // Log the error
              return res.status(500).json({ error: 'User creation failed', details: error.message });
          }
          res.status(201).json({ user_id: results.insertId, username, email });
      });
  } catch (err) {
      console.error('Server Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login Route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const query = 'SELECT * FROM users WHERE email = ?';
  connection.query(query, [email], async (error, results) => {
      if (error) {
          console.error('Error fetching user:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (results.length === 0) {
          return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = results[0];

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(401).json({ error: 'Invalid email or password' });
      }

      res.status(200).json({ user_id: user.user_id, username: user.username, email: user.email });
  });
});

// Insert car details
app.post('/api/cars', async (req, res) => {
  const carDetails = req.body;

  const { data, error } = await supabase
    .from('car_details') // Ensure this table exists in Supabase
    .insert([{
      make: carDetails.make,
      model: carDetails.model,
      year: carDetails.year,
      vehicle_type: carDetails.vehicleType,
      engine_capacity: carDetails.engineCapacity,
      fuel_type: carDetails.fuelType,
      transmission: carDetails.transmission,
      color: carDetails.carColor,
      license_plate: carDetails.licensePlate,
      registration_date: carDetails.registrationDate,
      seating_capacity: carDetails.seatingCapacity,
      mileage: carDetails.mileage,
      price: carDetails.price,
      car_image_url: carDetails.carImage
    }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json({ message: 'Car details added successfully'});
});

// Update car details
app.put('/api/cars/:licensePlate', async (req, res) => {
  const licensePlate = req.params.licensePlate;
  const carDetails = req.body;

  const { error } = await supabase
    .from('car_details') // Ensure this table exists in Supabase
    .update({
      make: carDetails.make,
      model: carDetails.model,
      year: carDetails.year,
      vehicle_type: carDetails.vehicle_type,
      engine_capacity: carDetails.engine_capacity,
      fuel_type: carDetails.fuel_type,
      transmission: carDetails.transmission,
      color: carDetails.color,
      registration_date: carDetails.registration_date,
      seating_capacity: carDetails.seating_capacity,
      mileage: carDetails.mileage,
      price: carDetails.price,
      car_image_url: carDetails.car_image
    })
    .eq('license_plate', licensePlate);

  if (error) {
    console.error('Error updating car details:', error);
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json({ message: 'Car details updated successfully' });
});

// Delete car details
app.delete('/api/cars/:licensePlate', async (req, res) => {
  const licensePlate = req.params.licensePlate;

  const { error } = await supabase
    .from('car_details') // Ensure this table exists in Supabase
    .delete()
    .eq('license_plate', licensePlate);

  if (error) {
    console.error('Error deleting car details:', error);
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json({ message: 'Car details deleted successfully' });
});

app.post('/api/users', async (req, res) => {
    const { name, email, phone } = req.body;

    // Check if the user already exists
    const { data: existingUser, error: checkError } = await supabase
        .from('users') // Ensure this table exists in Supabase
        .select('id')
        .or(`email.eq.${email},phone.eq.${phone}`); // Check for existing user by email or phone

    if (checkError) {
        console.error('Error checking user:', checkError);
        return res.status(500).json({ error: checkError.message });
    }

    if (existingUser.length > 0) {
        // User exists, return the existing user ID
        return res.status(200).json({ userId: existingUser[0].id });
    } else {
        // User does not exist, insert a new user
        const { data: newUser, error: insertError } = await supabase
            .from('users') // Ensure this table exists in Supabase
            .insert([{ name, email, phone }]);

        if (insertError) {
            console.error('Error inserting user:', insertError);
            return res.status(500).json({ error: insertError.message });
        }

        res.status(201).json({ message: 'User created', userId: data});
    }
});

app.post('/api/bookings', async (req, res) => {
  const { rental_days, car_license_plate, user_id } = req.body;

  const { data, error } = await supabase
    .from('rentals') // Ensure this table exists in Supabase
    .insert([{ rental_days, car_license_plate, user_id }]);

  if (error) {
    console.error('Error inserting booking:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ message: 'Booking confirmed'});
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 