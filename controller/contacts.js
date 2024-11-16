const mongoose = require('mongoose');
const Contact = require('../models/Contact');

const contacts = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    message: 'I would like more information about your services.',
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+0987654321',
    message: 'Please contact me to discuss a potential project.',
  },
];

const seedContacts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/contactDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await Contact.deleteMany({});
    await Contact.insertMany(contacts);

    console.log('Contacts seeded successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding contacts:', error);
    process.exit(1);
  }
};

seedContacts();
