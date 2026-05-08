const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const app = require('./app');

const rawDatabase = process.env.DATABASE;
const dbPassword = process.env.DATABASE_PASSWORD;

if (!rawDatabase) {
  console.error('ERROR: Missing DATABASE environment variable.');
  process.exit(1);
}

let DB = rawDatabase;
if (DB.includes('<db_password>')) {
  if (!dbPassword) {
    console.error('ERROR: Missing DATABASE_PASSWORD environment variable.');
    process.exit(1);
  }
  DB = DB.replace('<db_password>', dbPassword);
}

mongoose
  .connect(DB)
  .then(() => {
    console.log('DB connection successful!');
  })
  .catch(err => {
    console.error('DB connection error:', err.message || err);
    process.exit(1);
  });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port} in ${process.env.NODE_ENV} mode...`);
});