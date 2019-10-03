var ua = require('user-agents');
var fs = require("fs");
var http = require("http");
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');

var START_URL = "http://www.e-carscyprus.com/";
var SEARCH_WORD = "KIA RIO";
var MAX_PAGES_TO_VISIT = 10000;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
var ten_times = 0
var iot_pages = [];

pagesToVisit.push(START_URL);
crawl();

function crawl() {

  const userAgent = ua.random();
  global.navigator = require('web-midi-api');
  navigator.__defineGetter__('userAgent', function () {
    return ua.random();
  });

  if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }

  var nextPage = pagesToVisit.pop();
  //if pagesToVisit empty array nextPage will be undefined, so this means all urls crawled
  if (nextPage == undefined){
   console.log("PROCESS FINISHED! FOUND: "+ten_times+", PAGES THAT CONTAIN THE WORD “IoT” AND THIS PAGE(S): "+ iot_pages);
   console.log("Crawled :"+ numPagesVisited + " pages")
   render(first_url);
   return;
  }
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  //we will not crawl pdf and image/media lib. and zip files
  if(url.includes('.pdf') || url.includes('.zip') || url.includes('.PDF') || url.includes('/media-library/')){callback(); return;}
  numPagesVisited++;

  // Make the request
  console.log("Visiting page " + url);
  request(url, function(error, response, body) {
     // Check status code (200 is HTTP OK)
     console.log("Status code: " + response.statusCode);
     if(response.statusCode !== 200) {
       callback();
       return;
     }
     // Parse the document body
     var $ = cheerio.load(body);
     var isWordFound = searchForWord($, SEARCH_WORD);
     if(isWordFound) {
       console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
	if(ten_times < 10){if(ten_times == 0){first_url = url;} ten_times++; iot_pages.push(url);
         console.log("*****");  
         callback(); return;}
        else {return console.log("the end...");}
     } else {
       collectInternalLinks($);
       // In this short program, our callback is just calling crawl()
       callback();
     }
  });
}

function searchForWord($, word) {
  var bodyText = $('html > body').text();
  return(bodyText.indexOf(word) !== -1);
}

function collectInternalLinks($) {
    var relativeLinks = $("a[href^='/']");
    //console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
        pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
}

function render(url) {

    html = request(url, function(error, response, html) {  
    html = html.replace(/KIA RIO/g,'<mark>KIA RIO</mark>')
    fs.writeFile('iot.html', html, function (err){ if (err) throw err; console.log('New HTML file is created successfully.');
    //rendering process
    var server = http.createServer(function (req, res){
      res.writeHead(200, {"Content-Type": "text/html"});
      var myReadStream = fs.createReadStream(__dirname + "/KIA-RIO.html", "utf8");
      myReadStream.pipe(res);
    });
    server.listen(3000, "localhost");
    console.log("You can open localhost, port 3000 and see highlighted "+ SEARCH_WORD + " words.");
});
  });
}
