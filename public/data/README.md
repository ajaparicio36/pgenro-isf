# Shapefile Data

Place the `province_sub.zip` file in this directory for the heatmap to work properly.

The shapefile should contain barangay boundaries with the following properties:
- `adm4_psgc`: Official PSGC code that matches the `officialCode` in your database
- `adm4_en`: Barangay name in English
- `adm3_en`: Municipality name in English
- `adm2_en`: Province name in English

## File Structure
```
public/
└── data/
    └── province_sub.zip
```

The application will automatically load and parse this shapefile to display barangay boundaries on the map.

# GeoJSON Data

Place the `province_barangays.geojson` file in this directory for the heatmap to work properly.

## Converting Shapefile to GeoJSON

You can convert your `province_sub.zip` shapefile to GeoJSON using:

### Using QGIS (Recommended)
1. Open QGIS (free desktop GIS software)
2. Load your shapefile
3. Right-click the layer > Export > Save Features As
4. Choose GeoJSON format
5. Save as `province_barangays.geojson`

### Using Online Tools
- Visit mapshaper.org
- Upload your shapefile
- Export as GeoJSON

### Using Command Line
```bash
ogr2ogr -f GeoJSON province_barangays.geojson province_sub.shp
```

## Required Properties

The GeoJSON should contain features with these properties:
- `adm4_psgc`: Official PSGC code that matches the `officialCode` in your database
- `adm4_en`: Barangay name in English
- `adm3_en`: Municipality name in English
- `adm2_en`: Province name in English

## File Structure
```
public/
└── data/
    ├── province_barangays.geojson
    └── README.md
```
