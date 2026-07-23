const Parser = require('rss-parser');
const parser1 = new Parser();
const parser2 = new Parser({ xml2js: { strict: false } });

const xml = `<rss><channel><item><title>Test</title><description><img src="b" async></description></item></channel></rss>`;

async function run() {
  try {
    await parser1.parseString(xml);
    console.log('Parser 1 success');
  } catch(e) {
    console.log('Parser 1 failed:', e.message);
  }
  
  try {
    await parser2.parseString(xml);
    console.log('Parser 2 success');
  } catch(e) {
    console.log('Parser 2 failed:', e.message);
  }
}
run();
