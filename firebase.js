const admin = require('firebase-admin');
const serviceAccount = require('./konect-fc23b-firebase-adminsdk-fbsvc-66287ebf8c.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


module.exports = admin;