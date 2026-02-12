// Toggle this to true if testing against SMTP with self-signed certs
process.env.SMTP_ALLOW_INSECURE = process.env.SMTP_ALLOW_INSECURE || 'true';
(async ()=>{
  const mailer = require('../src/utils/mailer');
  try{
    await mailer.sendVerificationEmail({to:'devnull@example.com', username:'dev', url:'http://localhost/test?token=abc'});
    console.log('done');
  }catch(e){
    console.error('err', e && e.message);
    if (e && e.message && e.message.toLowerCase().includes('self-signed')) {
      console.warn('\nHint: the SMTP server is using a self-signed certificate. In dev you can:');
      console.warn('- Set SMTP_ALLOW_INSECURE=true in your .env (insecure, dev only)');
      console.warn("- Or add the CA to Node trust and run: NODE_EXTRA_CA_CERTS='C:\\path\\to\\ca.pem' node server.js");
    }
    process.exit(1);
  }
})();