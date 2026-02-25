const { ImapFlow } = require('imapflow');

async function testConnection() {
  const user = process.env.IMAP_TEST_USER;
  const pass = process.env.IMAP_TEST_PASS;

  if (!user || !pass) {
    console.error('Set IMAP_TEST_USER and IMAP_TEST_PASS before running this script.');
    process.exit(1);
  }

  const client = new ImapFlow({
    host: 'outlook.office365.com',
    port: 993,
    secure: true,
    auth: {
      user,
      pass
    },
    logger: console
  });

  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected!');
    
    const mailbox = await client.openBox('INBOX');
    console.log('Opened INBOX');
    
    const messages = await client.search(['ALL'], { envelope: true });
    console.log(`Found ${messages.length} messages`);
    
    await client.logout();
    console.log('Done');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testConnection();
