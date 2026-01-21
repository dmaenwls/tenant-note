import os
import glob
import numpy as np
import pandas as pd
import geopandas as gpd
import rasterio
from rasterio.merge import merge
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterstats import zonal_stats
from shapely.geometry import box

# Configuration
DATA_DIR = os.path.join(os.getcwd(), 'data')
DEM_DIR = os.path.join(DATA_DIR, 'dem')
SHP_DIR = os.path.join(DATA_DIR, 'shp')
DERIVED_DIR = os.path.join(DATA_DIR, 'derived')
RESULT_CSV = os.path.join(DERIVED_DIR, 'seoul_slope_complete.csv')

# Target CRS
TARGET_CRS = 'EPSG:5179'

def get_shapefile_path():
    # Try exact match first
    p = os.path.join(SHP_DIR, 'BND_ADM_DONG.shp')
    if os.path.exists(p):
        return p
    # Try _PG suffix
    p_pg = os.path.join(SHP_DIR, 'BND_ADM_DONG_PG.shp')
    if os.path.exists(p_pg):
        return p_pg
    raise FileNotFoundError("Could not find BND_ADM_DONG.shp or BND_ADM_DONG_PG.shp in data/shp")

def calculate_slope(dem_array, transform, nodata):
    """
    Calculate slope in degrees from DEM array.
    """
    # Pixel size
    px, py = transform[0], -transform[4] # py is usually negative
    
    # Handle nodata
    if nodata is not None:
        dem_masked = np.ma.masked_equal(dem_array, nodata)
    else:
        dem_masked = dem_array

    # Gradient (dy, dx) - note np.gradient returns gradient for axis 0 (y), then axis 1 (x)
    # spacing is (dy, dx)
    grads = np.gradient(dem_masked, py, px)
    dy = grads[0]
    dx = grads[1]

    # Slope in radians
    slope_rad = np.arctan(np.sqrt(dx**2 + dy**2))
    
    # Slope in degrees
    slope_deg = np.degrees(slope_rad)
    
    return slope_deg

def main():
    print("Starting Seoul Slope Analysis...")
    os.makedirs(DERIVED_DIR, exist_ok=True)

    # 1. Mosaic DEMs
    print("Step 1: Mosaicking DEM files...")
    dem_files = glob.glob(os.path.join(DEM_DIR, "*.img"))
    if not dem_files:
        raise FileNotFoundError(f"No .img files found in {DEM_DIR}")
    
    src_files_to_mosaic = []
    try:
        for fp in dem_files:
            src = rasterio.open(fp)
            src_files_to_mosaic.append(src)
        
        mosaic, out_trans = merge(src_files_to_mosaic)
        
        # Get metadata from first file and update
        src_meta = src_files_to_mosaic[0].meta.copy()
        src_meta.update({
            "driver": "GTiff",
            "height": mosaic.shape[1],
            "width": mosaic.shape[2],
            "transform": out_trans,
            "count": 1 # Assume 1 band for DEM statistics
        })
        
        # Verify CRS of Mosaic
        mosaic_crs = src_files_to_mosaic[0].crs
        print(f"Mosaic CRS: {mosaic_crs}")

    finally:
        # Close handles
        for src in src_files_to_mosaic:
            src.close()

    # Flatten mosaic (bands, y, x) -> (y, x) if 1 band
    dem_array = mosaic[0]
    
    # 2. Load & Filter SHP
    print("Step 2: Loading and Filtering Shapefile...")
    shp_path = get_shapefile_path()
    gdf = gpd.read_file(shp_path, encoding='euc-kr') # CP949 or EUC-KR
    
    # Filter Seoul (11...)
    seoul_gdf = gdf[gdf['ADM_CD'].str.startswith('11')].copy()
    print(f"Filtered {len(seoul_gdf)} Seoul districts.")

    # 3. Reproject
    print(f"Step 3: Unifying Coordinate Systems to {TARGET_CRS}...")
    
    # Reproject Vector
    if seoul_gdf.crs != TARGET_CRS:
        print(f"Reprojecting Vector from {seoul_gdf.crs} to {TARGET_CRS}")
        seoul_gdf = seoul_gdf.to_crs(TARGET_CRS)
    
    # Check Raster CRS and Reproject if needed
    # Note: Reprojecting the vector is fast. Reprojecting the raster is slow.
    # If the raster is NOT in 5179, we MUST reproject the raster or the vector to match.
    # The prompt says "Unify... to EPSG:5179".
    # Creating an in-memory reprojected raster is best if needed.
    
    working_array = dem_array
    working_transform = out_trans
    working_crs = mosaic_crs

    # If Mosaic is NOT 5179, we should reproject the RASTER to 5179 to match the requirement strictly.
    # However, reprojecting vector to raster's CRS is often safer for stats... 
    # BUT finding "Slope" depends on units. If raster is lat/lon (4326), slope calc is WRONG without geotransform.
    # 5179 is projected (meters). Correct for slope.
    # So we MUST ensure raster is in a projected CRS (meters). 5179 is perfect.
    
    if mosaic_crs != TARGET_CRS:
        print(f"Reprojecting Raster from {mosaic_crs} to {TARGET_CRS}...")
        # We need to reproject the whole mosaic array. This can be complex with basic rasterio.
        # Easier strategy: Save mosaic to disk, then use rasterio.warp.reproject?
        # Or calculate slope on original (if projected) then warp?
        # Safer: Warp DEM to 5179 first.
        
        # Calculate transform for the reprojected raster
        dst_crs = TARGET_CRS
        height, width = dem_array.shape
        dst_transform, dst_width, dst_height = calculate_default_transform(
            mosaic_crs, dst_crs, width, height, *rasterio.transform.array_bounds(height, width, out_trans)
        )
        
        dst_array = np.zeros((dst_height, dst_width), dtype=dem_array.dtype)
        
        reproject(
            source=dem_array,
            destination=dst_array,
            src_transform=out_trans,
            src_crs=mosaic_crs,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            resampling=Resampling.bilinear
        )
        
        working_array = dst_array
        working_transform = dst_transform
        working_crs = dst_crs
        src_meta.update({
            'crs': dst_crs,
            'transform': dst_transform,
            'width': dst_width,
            'height': dst_height
        })

    # 4. Calculate Slope
    print("Step 4: Calculating Slope...")
    nodata_val = src_meta.get('nodata', -9999)
    slope_deg = calculate_slope(working_array, working_transform, nodata_val)
    
    # 5. Zonal Stats
    print("Step 5: Calculating Zonal Statistics...")
    
    # Prepare inputs
    # seoul_gdf geometry is ready
    # slope_deg is numpy array
    
    # A. Mean Slope
    print("   - Mean Slope")
    stats_mean = zonal_stats(
        seoul_gdf,
        slope_deg,
        affine=working_transform,
        stats=['mean'],
        nodata=np.nan # Slope of nodata should be ignored
    )
    seoul_gdf['mean_slope'] = [s['mean'] for s in stats_mean]
    
    # B. Steep Ratio (>10 deg)
    print("   - Steep Ratio (> 10 degrees)")
    # Create binary mask (1 if steep, 0 if not). Ignore NaNs.
    # Handle NaNs in slope (fill with 0 or handle in mask)
    # If slope_deg is masked array, fill_value might be needed.
    
    if np.ma.is_masked(slope_deg):
        slope_filled = slope_deg.filled(0) # Treat nodata as 0 slope for the binary mask? No, should be ignored.
        # Better: use rasterstats with nodata
        steep_mask = (slope_filled >= 10).astype(int)
        # But we must ensure the nodata areas are NOT counted in the total area.
        # Rasterstats handles `nodata` argument.
        # So we pass the binary mask, but tell rasterstats what the nodata value is (if we used one).
        # Strategy: Use `affine` and keep `nodata` as distinct.
        # Let's use a float array for steep_mask where 1.0=steep, 0.0=flat, and np.nan=nodata
        
        steep_float = np.where(slope_deg.mask, np.nan, (slope_deg.data >= 10).astype(float))
        nodata_arg = np.nan
    else:
        # If no mask, assume pure array
        steep_float = (slope_deg >= 10).astype(float)
        nodata_arg = None # Or check if original DEM had nodata

    stats_steep = zonal_stats(
        seoul_gdf,
        steep_float,
        affine=working_transform,
        stats=['mean'],
        nodata=nodata_arg
    )
    # The 'mean' of 0s and 1s is exactly the ratio.
    seoul_gdf['steep_ratio'] = [s['mean'] * 100 if s['mean'] is not None else 0 for s in stats_steep]

    # 6. Save Results
    print("Step 6: Saving Results...")
    # Select columns
    # SHP likely produces lowercase column names on read sometimes? Or keep original.
    # Check column names. usually ADM_CD, ADM_NM.
    
    # Try to find correct columns case-insensitive
    cols = seoul_gdf.columns
    adm_cd_col = next((c for c in cols if c.upper() == 'ADM_CD'), 'ADM_CD')
    adm_nm_col = next((c for c in cols if c.upper() == 'ADM_NM'), 'ADM_NM')
    
    output_df = seoul_gdf[[adm_cd_col, adm_nm_col, 'mean_slope', 'steep_ratio']].copy()
    output_df.columns = ['adm_cd', 'adm_nm', 'mean_slope', 'steep_ratio']
    
    output_df.to_csv(RESULT_CSV, index=False, encoding='utf-8-sig')
    print(f"Done! Saved to {RESULT_CSV}")

if __name__ == "__main__":
    main()
