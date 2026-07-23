let xml = `<rss version="2.0"><channel><item><title>Test</title><description>Some stuff</description><link async defer /> <img src="a" async /></item></channel></rss>`;

// Regex to fix boolean attributes in tags
xml = xml.replace(/<(?!\/?!)([^>]+)>/g, (match, tagContent) => {
  let tagParts = tagContent.match(/^(\/?[a-zA-Z0-9_:-]+)\s*(.*)$/);
  if (!tagParts) return match;
  
  let tagName = tagParts[1];
  let attrs = tagParts[2];
  if (!attrs.trim()) return match;
  
  let isSelfClosing = attrs.endsWith('/');
  if (isSelfClosing) {
    attrs = attrs.slice(0, -1);
  }
  
  // match attributes
  let newAttrs = attrs.replace(/([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?/g, (attrMatch, attrName) => {
    if (!attrMatch.includes('=')) {
      return `${attrName}="${attrName}"`;
    }
    return attrMatch;
  });
  
  return `<${tagName}${newAttrs ? ' ' + newAttrs : ''}${isSelfClosing ? '/' : ''}>`;
});

console.log(xml);
