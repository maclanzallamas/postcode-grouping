const https = require('https')
var cluster = require('hierarchical-clustering');

// Euclidean distance
function distance(a, b) {
  var d = 0;
  for (var i = 0; i < a.length; i++) {
    d += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(d);
}
 
// Single-linkage clustering
function linkage(distances) {
  return Math.min.apply(null, distances);
}
 

const data = JSON.stringify({
  postcodes: ["G1 1RD", "AB10 7AY", "DD1 1NJ", "E1 6AN", "BN1 1FN", "CO1 1YH", "M1 1EW", "L1 0AN", "LS15 8GB"]
})

const options = {
  hostname: 'postcodes.io',
  port: 443,
  path: '/postcodes',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}

const req = https.request(options, res => {
  //console.log(`statusCode: ${res.statusCode}`)
  console.log("API call to get latitude/longitude\nSuccess");
  let todo = "";

  res.on('data', d => {
    todo += d
  })

  res.on('end', () => {
    const result = JSON.parse(todo);
    const arrayTest = [];
    result.result.forEach(element => {
      if (element.result != null) {
        arrayTest.push([element.result.longitude, element.result.latitude])
      }
    });

    // We have a matrix with the latitude and longituede
    var levels = cluster({
      input: arrayTest,
      distance: distance,
      linkage: linkage,
      minClusters: Math.ceil(arrayTest.length/4),
    });
     
    var clusters = levels[levels.length - 1].clusters;

    clusters = clusters.map(function (cluster) {
      return cluster.map(function (index) {
        return arrayTest[index];
      });
    });
    console.log("Clusters:")
    console.log(clusters);

    clusters.forEach(cluster => {

      let data2 = JSON.stringify({
        geolocations: cluster.map((c) => ({longitude: c[0], latitude:c[1]}))
      })
      const options2 = {
        hostname: 'postcodes.io',
        port: 443,
        path: '/postcodes',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
  
      const req2 = https.request(options2, res2 => {
        //console.log(`statusCode: ${res.statusCode}`)
        console.log("Postcode Group:")
        let todo2 = "";
      
        res2.on('data', d => {
          todo2 += d
        })
      
        res2.on('end', () => {
          const result = JSON.parse(todo2);
          const arrayTest = [];
          result.result.forEach(element => {
            arrayTest.push(element.result[0].postcode)
          });
          console.log(arrayTest);
        })
      })
      req2.on('error', error => {
        console.error(error)
      })
      
      req2.write(data2)
      req2.end()
    });
  })
})

req.on('error', error => {
  console.error(error)
})

req.write(data)
req.end()

