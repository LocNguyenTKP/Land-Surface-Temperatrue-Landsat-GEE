# Land-Surface-Temperatrue-Landsat-GEE
Land Surface Temperature (LST) data derived from Landsat imagery, which can be analyzed using Google Earth Engine (GEE)

## Overview
This project utilizes Google Earth Engine to analyze Landsat 8 imagery for the Can Tho area, focusing on several key environmental indicators: Normalized Difference Vegetation Index (NDVI), Normalized Difference Water Index (NDWI), Normalized Difference Built-up Index (NDBI), and Land Surface Temperature (LST). The script preprocesses the imagery, applies cloud masking, calculates the indices, and assesses correlations among them.
* This code and the exported results of these GEE scripts:
  [https://code.earthengine.google.com/?accept_repo=users/nguyenloctkp/github ](https://code.earthengine.google.com/?accept_repo=users%2Fdaviddaou%2Ftestdelta&scriptPath=users%2Fnguyenloctkp%2Fgithub%3ARandom%20Forest%20LULC%20Classification%20)

## Key Features
### 1. Image Processing and Scaling
Landsat 8 images are scaled and offset for both optical and thermal bands.
Clouds and shadows are masked using the QA_PIXEL band to improve data quality.
### 2. Index Calculation
* NDVI: Indicates vegetation health.
* NDWI: Helps in identifying water bodies.
* NDBI: Distinguishes built-up areas.
* LST: Calculates land surface temperature indicating heat intensity.
### 3. Visualization and Analysis
* The script includes visualization parameters for better interpretation of the indices on the map.
* Land surface emissivity is computed based on the fraction of vegetation.
### 4. Export Options
The code includes commented sections for exporting the processed images to Google Drive, which can be customized and used as needed.
### 5. User Interface Components
A dynamic legend for LST visualization is integrated within the Earth Engine user interface to aid in interpreting temperature variations.

## Usage
To run this script, users should replace placeholder values with actual region of interest coordinates and other specific parameters related to their study area. The script is modular and allows for easy adaptation to other regions or datasets.

## Contributing
Contributions to this project are welcome. Please fork the repository and submit a pull request with your suggested changes.

## Acknowledgement
This repository was developed by Loc Nguyen under the supervision of Dr. David Daou during February - April 2024 at the United Nations University (UNU) ; Institute for Environment and Human Security (UNU-EHS). 

## Contact
For any queries or further collaboration, feel free to contact Loc Nguyen nguyenloctkp@gmail.com.

