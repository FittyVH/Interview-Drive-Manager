const dns = require('node:dns/promises');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config(); 
const app = require('./src/app');
const connectToDB = require('./src/db/db');

connectToDB();

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})