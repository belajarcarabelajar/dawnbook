const http = require('http');

const data = JSON.stringify({
  bookSlug: 'virtue-ethics-aristoteles',
  path: '/books/virtue-ethics-aristoteles/content/02_akar-filosofis-aristoteles-dan-tradisi-klasik.html'
});

console.log("Simulating POST...");
