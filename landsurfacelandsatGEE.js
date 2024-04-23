Map.addLayer(asd, {}, 'AOI - CAN THO');
Map.centerObject(asd, 10);

var startDate = '2023-01-01';
var endDate = '2023-12-30';

// Applies scaling factors.
function applyScaleFactors(image) {
 // Scale and offset values for optical bands
 var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
 
 // Scale and offset values for thermal bands
 var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
 
 // Add scaled bands to the original image
 return image.addBands(opticalBands, null, true)
 .addBands(thermalBands, null, true);
}

// Applies scaling factors.
function applyScaleFactors(image) {
 // Scale and offset values for optical bands
 var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
 
 // Scale and offset values for thermal bands
 var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
 
 // Add scaled bands to the original image
 return image.addBands(opticalBands, null, true)
 .addBands(thermalBands, null, true);
}

// Function to Mask Clouds and Cloud Shadows in Landsat 8 Imagery

function cloudMask(image) {
  // Define cloud shadow and cloud bitmasks (Bits 3 and 5)
  var cloudShadowBitmask = (1 << 3);
  var cloudBitmask = (1 << 5);

  // Select the Quality Assessment (QA) band for pixel quality information
  var qa = image.select('QA_PIXEL');

  // Create a binary mask to identify clear conditions (both cloud and cloud shadow bits set to 0)
  var mask = qa.bitwiseAnd(cloudShadowBitmask).eq(0)
                .and(qa.bitwiseAnd(cloudBitmask).eq(0));

  // Update the original image, masking out cloud and cloud shadow-affected pixels
  return image.updateMask(mask);
}

// Import and preprocess Landsat 8 imagery

var imageCollection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
                        .filterBounds(asd)
                        .filterDate(startDate, endDate)
                        .map(applyScaleFactors)
                        .map(cloudMask);

// Check the specific image displayed
var sortedByCloud = imageCollection.sort('CLOUD_COVER');
var leastCloudyImage = sortedByCloud.first();
var date = leastCloudyImage.date().format('YYYY-MM-dd');
print('Date of the least cloudy image:', date);


// Define visualization parameters for True Color imagery (bands 4, 3, and 2)
var visualization = {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 0.0,
  max: 0.15,
};

// Map a function over the ImageCollection to extract the acquisition date of each image
var imageDates = imageCollection.map(function(image) {
  return ee.Feature(null, {date: image.date().format('YYYY-MM-dd')});
});

// Flatten the collection of features into a list of dates
var listOfDates = imageDates.aggregate_array('date');

// Print the list of dates
listOfDates.getInfo(function(date) {
  print('Acquisition dates of the images:', date);
});

var image = imageCollection.median()
                          .clip(asd);


// Calculate Normalized Difference Vegetation Index (NDVI)
var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');

// Define NDVI Visualization Parameters
var ndviPalette = {
 min: -1,
 max: 1,
 palette: ['blue', 'white', 'green']
};

Map.addLayer(ndvi, ndviPalette, 'NDVI Can Tho')

// Calculate the minimum NDVI value within the AOI
var ndviMin = ee.Number(ndvi.reduceRegion({
  reducer   : ee.Reducer.min(),
  geometry  : asd,
  scale     : 30,
  maxPixels : 1e9
}).values().get(0));

// Calculate the maximum NDVI value within the AOI
var ndviMax = ee.Number(ndvi.reduceRegion({
  reducer   : ee.Reducer.max(),
  geometry  : asd,
  scale     : 30,
  maxPixels : 1e9
}).values().get(0));


// Print the Minimum and Maximum NDVI Values
print("Minimum NDVI:", ndviMin);
print("Maximum NDVI:", ndviMax);

// Fraction of Vegetation (FV) Calculation
// Formula: ((NDVI - NDVI_min) / (NDVI_max - NDVI_min))^2

// Calculate the Fraction of Vegetation (FV) using the NDVI values within the specified range.
// NDVI_min represents the minimum NDVI value, and NDVI_max represents the maximum NDVI value
var fv = ((ndvi.subtract(ndviMin)).divide(ndviMax.subtract(ndviMin)))
          .pow(ee.Number(2))
          .rename('FV');
        

// Calculate Normalized Difference Water Index (NDWI)
var ndwi = image.normalizedDifference(['SR_B3', 'SR_B5']).rename('NDWI');

// Define NDWI Visualization Parameters
var ndwiVisualization = {
 min: -1,
 max: 1,
 palette: ['0000FF', 'FFFFFF', '00FF00'] // Blue to White to Green palette for water
};

// Add the NDWI layer to the map
Map.addLayer(ndwi, ndwiVisualization, 'NDWI Can Tho');

// Calculate Normalized Difference Built-up Index (NDBI)
var ndbi = image.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI');

// Define NDBI Visualization Parameters
var ndbiVisualization = {
 min: -1,
 max: 1,
 palette: ['00FF00', 'FFFFFF', 'FF0000'] // Green to White to Red palette for built-up areas
};

// Add the NDBI layer to the map
Map.addLayer(ndbi, ndbiVisualization, 'NDBI Can Tho');




// Emissivity Calculation
// Formula: 0.004 * FV + 0.986

// Calculate Land Surface Emissivity (EM) using the Fraction of Vegetation (FV).
// The 0.004 coefficient represents the emissivity variation due to vegetation,
// and the 0.986 represents the base emissivity for other surfaces.

var em = fv.multiply(ee.Number(0.004)).add(ee.Number(0.986)).rename('EM');

// Select Thermal Band (Band 10) and Rename It
var thermal = image.select('ST_B10').rename('thermal');

// Now, lets calculate the land surface temperature (LST)

// Formula: (TB / (1 + (λ * (TB / 1.438)) * ln(em))) - 273.15
var lst = thermal.expression(
  '(TB / (1 + (0.00115 * (TB / 1.438)) * log(em))) - 273.15', {
    'TB': thermal.select('thermal'), // Select the thermal band (TB)
    'em': em // Assign emissivity (em)
  }).rename('LST Can Tho');

// Add the LST Layer to the Map with Custom Visualization Parameters
Map.addLayer(lst, {
  min: 25, // Minimum LST value
  max: 40, // Maximum LST value
  palette: [
    '0502a3', '0502b8', '0502ce', '0602ff', '235cb1',
    '307ef3', '32d3ef', '3ff38f', '86e26f', 'b5e22e',
    'd6e21f', 'fff705', 'ffd611', 'ff8b13', 'ff0000'
  ]}, 'Land Surface Temperature');
  
  
  // Create a Legend for Land Surface Temperature (LST) Visualization
var minLST = 20; // Minimum LST value
var maxLST = 40; // Maximum LST value

// Create a panel for the legend with styling
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 10px',
    backgroundColor: 'white'
  }
});

// Create a title for the legend
var legendTitle = ui.Label({
  value: 'Land Surface Temperature (°C)',
  style: {
    fontWeight: 'bold',
    fontSize: '20px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});

// Add the legend title to the legend panel
legend.add(legendTitle);

// Define a color palette for the legend
var palette = [
  '0502a3', '0602ff', '269db1', '32d3ef', '3ff38f', 
  '86e26f', 'b5e22e', 'ffd611', 'ff6e08', 'de0101'
];

// Calculate the step value for the legend
var step = (maxLST - minLST) / (palette.length - 1);

// Loop through the palette and create legend entries
for (var i = 0; i < palette.length; i++) {
  // Create a color box for each legend entry
  var colorBox = ui.Label({
    style: {
      backgroundColor: '#' + palette[i],
      padding: '8px',
      margin: '0 0 8px 0',
      width: '44px'
    }
  });

  // Create a label with LST values for each legend entry
  var legendLabel = ui.Label({
    value: (minLST + i * step).toFixed(2),
    style: { margin: '0 0 10px 6px' }
  });

  // Create a panel to arrange color box and label horizontally
  var legendPanel = ui.Panel({
    widgets: [colorBox, legendLabel],
    layout: ui.Panel.Layout.Flow('horizontal')
  });

  // Add the legend entry panel to the main legend panel
  legend.add(legendPanel);
}

// Add the legend to the Google Earth Engine map
Map.add(legend);
/*
// Export the LST image to Google Drive
Export.image.toDrive({
  image: lst, // Replace 'lst' with your LST image variable
  description: 'LST_CanTho_2023',
  folder: 'GEENEW',
  fileNamePrefix: 'LST_CanTho_2023',
  scale: 30, // Specify the scale if different
  region: CT.geometry(), // Define the export region; ensure 'CT' is your area of interest's variable
  maxPixels: 1e9
});

Export.image.toDrive({
  image: ndvi,
  description: 'NDVI_CanTho_2023',
  folder: 'GEENEW',
  fileNamePrefix: 'NDVI_CanTho_2023',
  scale: 30,
  region: CT.geometry(),
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

Export.image.toDrive({
  image: ndwi,
  description: 'NDWI_CanTho_2023',
  folder: 'GEENEW',
  fileNamePrefix: 'NDWI_CanTho_2023',
  scale: 30,
  region: CT.geometry(),
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

Export.image.toDrive({
  image: ndbi,
  description: 'NDBI_CanTho_2023',
  folder: 'GEENEW',
  fileNamePrefix: 'NDBI_CanTho_2023',
  scale: 30,
  region: CT.geometry(),
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});
*/
// Calculate the minimum LST value within the AOI
var minLSTValue = lst.reduceRegion({
  reducer: ee.Reducer.min(),
  geometry: asd,
  scale: 30,
  maxPixels: 1e9
}).getNumber('LST Can Tho').getInfo();

// Calculate the maximum LST value within the AOI
var maxLSTValue = lst.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: asd,
  scale: 30,
  maxPixels: 1e9
}).getNumber('LST Can Tho').getInfo();

// Calculate the average LST value within the AOI
var avgLSTValue = lst.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: asd,
  scale: 30,
  maxPixels: 1e9
}).getNumber('LST Can Tho').getInfo();

// Print the Minimum, Maximum, and Average LST Values
print("Minimum LST: ", minLSTValue, "°C");
print("Maximum LST: ", maxLSTValue, "°C");
print("Average LST: ", avgLSTValue, "°C");

