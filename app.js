const express = require('express');
const path=require('path')
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const port = 3000;

//create connection pool
const pool =mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'chiru',
    database: 'prs'
});

app.use(bodyParser.urlencoded({ extended: true }));
 
// Generate a secure secret key
const secretKey = crypto.randomBytes(32).toString('hex');
// Configure session middleware
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true,
}));

app.set("view engine","ejs");
app.set('views',path.join(__dirname,'html'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));



app.get('/', (req, res) => {
    // Fetch the slots data from the database
    pool.query('SELECT * FROM Slots', (err, results) => {
        if (err) {
            console.error('Error retrieving slots data from the database:', err);
            // Handle the error condition and send an appropriate response
            res.status(500).send('Internal Server Error');
            return;
        }
        
        // Generate the HTML for the slot list dynamically
        const slotListHtml = generateSlotListHtml(results);
        
        // Render the index view and pass the slotListHtml to it
        res.render('index', { slotListHtml });
    });
});

function generateSlotListHtml(slots) {
    let html = '<table style="border: 1px solid black; padding: 5px;">';
    html += '<tr><th style="border: 1px solid black; padding: 5px;">Slot ID</th><th style="border: 1px solid black; padding: 5px;">Slot Number</th><th style="border: 1px solid black; padding: 5px;">Vehicle Type</th><th style="border: 1px solid black; padding: 5px;">Price per Hour</th><th style="border: 1px solid black; padding: 5px;">Availability</th><th style="border: 1px solid black; padding: 5px;">Details</th></tr>';
  
    slots.forEach((slot) => {
        html += `<tr>
            <td style="border: 1px solid black; padding: 5px;">${slot.sid}</td>
            <td style="border: 1px solid black; padding: 5px;">${slot.sno}</td>
            <td style="border: 1px solid black; padding: 5px;">${slot.vehicle_type}</td>
            <td style="border: 1px solid black; padding: 5px;">${slot.price_per_hour}</td>
            <td style="border: 1px solid black; padding: 5px;">${slot.is_available ? 'Available' : 'Not Available'}</td>
            <td style="border: 1px solid black; padding: 5px;">${slot.details}</td>
        </tr>`;
    });
  
    html += '</table>';
    return html;
}

// Route for the new user registration page
app.get('/new', (req, res) => {
    res.render('new');
});

app.post('/register', (req, res) => {
    // Extract the form data from the request body
    const { name, uname, pass, email } = req.body;

    // Create a new user object with the extracted data
    const user = {
        uname: uname,
        upass: pass,
        uemail: email,
        name: name
    };

    // Insert the user object into the user table in the database
    pool.query('INSERT INTO user SET ?', user, (err, result) => {
        if (err) {
            console.error('Error inserting user into the database:', err);
            // Handle the error condition and send an appropriate response
            res.status(500).send('Internal Server Error');
            return;
        }

        // User successfully inserted, display a pop-up box or alert
        const message = 'Registration successful!'; // Change the message as desired
        res.send(`<script>alert('${message}'); window.location.href='/';</script>`);
    });
});

app.get('/user', (req, res) => {
    // Handle the user login page rendering
    res.render('user');
});

// Route for the admin login page
app.get('/admin', (req, res) => {
    // Handle the admin login page rendering
    res.render('admin');
});

app.post('/admin/login', (req, res) => {
    // Extract the username and password from the request body
    const { username, password } = req.body;
      pool.query('SELECT * FROM admin WHERE aname = ? AND apass = ?', [username, password], (err, results) => {
      if (err) {
        console.error('Error retrieving admin data from the database:', err);
        // Handle the error condition and send an appropriate response
        res.status(500).send('Internal Server Error');
        return;
      }
  
      if (results.length === 1) {
        // Authentication successful
        res.render('admindashboard');
      } else {
        // Authentication failed
        res.send('Admin login failed!');
      }
    });
  });
  

app.get('/about', (req, res) => {
    // Fetch the reviews data from the database
    pool.query('SELECT * FROM reviews', (err, results) => {
        if (err) {
            console.error('Error retrieving reviews data from the database:', err);
            // Handle the error condition and send an appropriate response
            res.status(500).send('Internal Server Error');
            return;
        }

        // Generate the HTML for the review list dynamically
        const reviewListHtml = generateReviewListHtml(results);

        // Render the about view and pass the reviewListHtml to it
        res.render('about', { reviewListHtml });
    });
});
function generateReviewListHtml(reviews) {
    let html = '';

    reviews.forEach((review) => {
        html += `<div class="review-item">
            <h4>Rating: ${review.rating}</h4>
            <p>${review.message}</p>
            <p>Posted by: ${review.name}</p>
            <p>Date: ${review.date}</p>
        </div>`;
    });

    return html;
}
// admindashboard

// Route to render the admin dashboard
const router = express.Router();
// Route handler for the dashboard
// Export the router
module.exports = router;

// Handle adding a new admin
app.post('/admin/add', (req, res) => {
    const { adminName, adminPassword } = req.body;
  
    // Perform the necessary logic to add a new admin to the database
    const sql = 'INSERT INTO Admin (aname, apass) VALUES (?, ?)';
    const values = [adminName, adminPassword];
  
    // Execute the SQL query to insert the new admin
    pool.query(sql, values, (error, result) => {
      if (error) {
        // Handle the error
        console.error(error);
        res.send('Error adding admin');
      } else {
        // Redirect to the admin dashboard or show a success message
        res.redirect('/admindashboard');
        // res.redirect('/admin_dashboard');
      }
    });
  });
  
  // Handle deleting a user
  app.post('/admin/delete/user', (req, res) => {
    const { userId } = req.body;
  
    // Perform the necessary logic to delete the user from the database
    const sql = 'DELETE FROM User WHERE uid = ?';
    const values = [userId];
  
    // Execute the SQL query to delete the user
    pool.query(sql, values, (error, result) => {
      if (error) {
        // Handle the error
        console.error(error);
        res.send('Error deleting user');
      } else {
        // Redirect to the admin dashboard or show a success message
        res.redirect('/admindashboard');
      }
    });
  });
  
  // Handle adding a new slot
  app.post('/admin/add/slot', (req, res) => {
    const { slotNumber, vehicleType, pricePerHour, isAvailable, slotDetails } = req.body;
  
    // Perform the necessary logic to add a new slot to the database
    const sql = 'INSERT INTO Slots (sno, vehicle_type, price_per_hour, is_available, details) VALUES (?, ?, ?, ?, ?)';
    const values = [slotNumber, vehicleType, pricePerHour, isAvailable, slotDetails];
  
    // Execute the SQL query to insert the new slot
    pool.query(sql, values, (error, result) => {
      if (error) {
        // Handle the error
        console.error(error);
        res.send('Error adding slot');
      } else {
        // Redirect to the admin dashboard or show a success message
        res.redirect('/admindashboard');
      }
    });
  });
  
  // Handle deleting a slot
  app.post('/admin/delete/slot', (req, res) => {
    const { slotId } = req.body;
  
    // Perform the necessary logic to delete the slot from the database
    const sql = 'DELETE FROM Slots WHERE sid = ?';
    const values = [slotId];
  
    // Execute the SQL query to delete the slot
    pool.query(sql, values, (error, result) => {
      if (error) {
        // Handle the error
        console.error(error);
        res.send('Error deleting slot');
      } else {
        // Redirect to the admin dashboard or show a success message
        res.redirect('/admindashboard');
      }
    });
  });
  
  // Handle updating pricing
  app.post('/admin/update/pricing', (req, res) => {
    const { slotId, newPricePerHour } = req.body;
  
    // Perform the necessary logic to update the pricing of a slot in the database
    const sql = 'UPDATE Slots SET price_per_hour = ? WHERE sid = ?';
    const values = [newPricePerHour, slotId];
  
    // Execute the SQL query to update the pricing
    pool.query(sql, values, (error, result) => {
      if (error) {
        // Handle the error
        console.error(error);
        res.send('Error updating pricing');
      } else {
        // Redirect to the admin dashboard or show a success message
        res.redirect('/admindashboard');
      }
    });
  });
  
  // Handle canceling a reservation
  app.post('/admin/cancel/reservation', (req, res) => {
    const { reservationId } = req.body;
  
    // Perform the necessary logic to cancel the reservation in the database
    const sql = 'UPDATE Reservations SET cancel_status = true WHERE resid = ?';
    const values = [reservationId];
  
    // Execute the SQL query to update the cancellation status
    pool.query(sql, values, (error, result) => {
      if (error) {
        // Handle the error
        console.error(error);
        res.send('Error canceling reservation');
      } else {
        // Redirect to the admin dashboard or show a success message
        res.redirect('/admindashboard');
      }
    });
  });

// admindashboard end 

app.get('/admindashboard',(req,res)=>{
  res.render('admindashboard');
});
app.get('/rate',(req,res)=>{
  res.render('rate');
});

app.post('/rate/send', (req, res) => {
    // Extract the rating, message, and name from the request body
    const { rating, message, name } = req.body;
    // Insert the review into the 'reviews' table
    pool.query(
      'INSERT INTO reviews (rating, message, date, name) VALUES (?, ?, CURDATE(), ?)',
      [rating, message, name],
      (error, results) => {
        if (error) {
          // Handle the database error
          console.error(error);
          res.send('Error saving the review.');
        } else {
          // Review saved successfully
          res.send('Review saved successfully!');
        }
      }
    );
  });
  
  // ...
  app.post('/user/login', (req, res) => {
    const { username, password } = req.body;
    
    // Perform the necessary logic to validate the user's credentials
    pool.query('SELECT * FROM user WHERE uname = ? AND upass = ?', [username, password], (err, results) => {
      if (err) {
        console.error('Error retrieving user data from the database:', err);
        // Handle the error condition and send an appropriate response
        res.status(500).send('Internal Server Error');
        return;
      }
    
      if (results.length === 1) {
        // Authentication successful
        // Create a session and store the user ID in it
        req.session.userId = results[0].uid;
        // Redirect the user to the user dashboard
        res.redirect('/user/dashboard');
      } else {
        // Authentication failed
        res.send('User login failed!');
      }
    });
  });
  app.get('/user/dashboard', (req, res) => {
    // Check if the user is logged in by checking the session
    if (req.session.userId) {
      const user = getUserById(req.session.userId);
      // User is logged in, render the user dashboard with the user information
      user.then((user) => {
        res.render('userdashboard', { user });
      }).catch((err) => {
        console.error('Error retrieving user data:', err);
        res.status(500).send('Internal Server Error');
      });
    } else {
      // User is not logged in, redirect to the user login page
      res.redirect('/user');
    }
  });
  
  function getUserById(userId) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM user WHERE uid = ?', [userId], (err, userResults) => {
        if (err) {
          console.error('Error retrieving user data from the database:', err);
          reject(err);
        } else {
          if (userResults.length === 1) {
            const user = userResults[0];
            pool.query('SELECT * FROM reservations WHERE userid = ?', [userId], (err, reservationsResults) => {
              if (err) {
                console.error('Error retrieving reservations data from the database:', err);
                reject(err);
              } else {
                user.reservations = reservationsResults;
                resolve(user);
              }
            });
          } else {
            reject(new Error('User not found'));
          }
        }
      });
    });
  }
  

// Route handler for user logout
app.post('/user/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    res.redirect('/');
  });
});


app.post('/user/reserve', (req, res) => {
  const { slotId, vehiclePlate, reserveDate } = req.body;
  const userId = req.session.userId;

  // Check if the slot exists
  pool.query('SELECT sid FROM slots WHERE sid = ?', [slotId], (err, result) => {
    if (err) {
      console.error('Error checking slot existence:', err);
      // Handle the error condition and send an appropriate response
      res.status(500).send('Internal Server Error');
    } else if (result.length === 0) {
      // Slot not found, reservation unsuccessful
      res.send('Reservation unsuccessful. Slot does not exist.');
    } else {
      // Check if there is a reservation for the slot on the given date
      pool.query(
        'SELECT resid, cancel_status FROM reservations WHERE slotid = ? AND reserve_date = ?',
        [slotId, reserveDate],
        (err, result) => {
          if (err) {
            console.error('Error checking reservation:', err);
            // Handle the error condition and send an appropriate response
            res.status(500).send('Internal Server Error');
          } else if (result.length === 0) {
            // No reservation found, allow for reservation
            const reservationData = {
              userid: userId,
              slotid: slotId,
              vehicle_plate_number: vehiclePlate,
              reserve_date: reserveDate,
              cancel_status: 0, // Assuming 0 represents an active reservation
            };

            pool.query('INSERT INTO reservations SET ?', reservationData, (err, result) => {
              if (err) {
                console.error('Error making a reservation:', err);
                // Handle the error condition and send an appropriate response
                res.status(500).send('Internal Server Error');
              } else {
                // Reservation successful
                res.send('Reservation successful!');
              }
            });
          } else {
            // Reservation found, check the cancellation status
            const cancellationStatus = result[0].cancel_status;

            if (cancellationStatus === 1) {
              // Reservation was canceled, allow for reservation
              const reservationData = {
                userid: userId,
                slotid: slotId,
                vehicle_plate_number: vehiclePlate,
                reserve_date: reserveDate,
                cancel_status: 0, // Assuming 0 represents an active reservation
              };

              pool.query('INSERT INTO reservations SET ?', reservationData, (err, result) => {
                if (err) {
                  console.error('Error making a reservation:', err);
                  // Handle the error condition and send an appropriate response
                  res.status(500).send('Internal Server Error');
                } else {
                  // Reservation successful
                  res.send('Reservation successful!');
                }
              });
            } else {
              // Reservation is active, reservation unsuccessful
              res.send('Reservation unsuccessful. Slot is already reserved on the specified date.');
            }
          }
        }
      );
    }
  });
});




app.post('/user/cancel', (req, res) => {
  const { reservationId } = req.body;

  // Retrieve the slot ID associated with the canceled reservation
  pool.query(
    'SELECT slotid FROM reservations WHERE resid = ?',
    [reservationId],
    (err, result) => {
      if (err) {
        console.error('Error retrieving slot ID:', err);
        // Handle the error condition and send an appropriate response
        res.status(500).send('Internal Server Error');
      } else {
        const slotId = result[0].slotid;

        // Perform the necessary logic to cancel a reservation
        pool.query(
          'UPDATE reservations SET cancel_status = 1 WHERE resid = ?',
          [reservationId],
          (err, result) => {
            if (err) {
              console.error('Error canceling a reservation:', err);
              // Handle the error condition and send an appropriate response
              res.status(500).send('Internal Server Error');
            } else {
              // Reservation canceled successfully
              // Update the availability of the slot in the slots table
              pool.query(
                'UPDATE slots SET is_available = 1 WHERE sid = ?',
                [slotId],
                (err, result) => {
                  if (err) {
                    console.error('Error updating slot availability:', err);
                    // Handle the error condition and send an appropriate response
                    res.status(500).send('Internal Server Error');
                  } else {
                    // Slot availability updated successfully
                    res.send('Reservation canceled!');
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});




app.post('/user/add-vehicle', (req, res) => {
  const { vehicleType, plateNumber, details } = req.body;
  const userId = req.session.userId;

  // Perform the necessary logic to add a vehicle
  const vehicleData = {
    userid: userId,
    vehicle_type: vehicleType,
    plate_number: plateNumber,
    details: details,
  };

  pool.query('INSERT INTO vehicle SET ?', vehicleData, (err, result) => {
    if (err) {
      console.error('Error adding a vehicle:', err);
      // Handle the error condition and send an appropriate response
      res.status(500).send('Internal Server Error');
    } else {
      // Vehicle added successfully
      res.send('Vehicle added successfully!');
    }
  });
});



app.listen(port, () => console.log(`Example app listening on port ${port}!`))