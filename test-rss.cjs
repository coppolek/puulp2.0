let xml = `<rss version="2.0"><channel><item><title>Test</title><content type="html">Some <img async> stuff</content></item></channel></rss>`;

xml = xml.replace(/<(title|description|content:encoded|content|summary|media:description)([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, content) => {
  if (content.includes('<![CDATA[')) {
    return match;
  }
  return `<${tag}${attrs}><![CDATA[${content}]]></${tag}>`;
});
console.log(xml);
