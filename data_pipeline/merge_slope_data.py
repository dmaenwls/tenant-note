import os
import pandas as pd
import geopandas as gpd

# Configuration
DATA_DIR = os.path.join(os.getcwd(), 'data')
SHP_DIR = os.path.join(DATA_DIR, 'shp')
DERIVED_DIR = os.path.join(DATA_DIR, 'derived')
PUBLIC_DATA_DIR = os.path.join(os.getcwd(), 'public', 'data')

CSV_PATH = os.path.join(DERIVED_DIR, 'seoul_slope_complete.csv')
OUTPUT_GEOJSON = os.path.join(PUBLIC_DATA_DIR, 'seoul_slope_v2.json')

def get_shapefile_path():
    p = os.path.join(SHP_DIR, 'BND_ADM_DONG.shp')
    if os.path.exists(p): return p
    p_pg = os.path.join(SHP_DIR, 'BND_ADM_DONG_PG.shp')
    if os.path.exists(p_pg): return p_pg
    raise FileNotFoundError("Shapefile not found in data/shp")

def main():
    print("Starting Data Merge for Map Visualization...")
    
    # Ensure public/data exists
    os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)

    # 1. Load Data
    print("Loading CSV...")
    df = pd.read_csv(CSV_PATH)
    # Ensure adm_cd is string for matching
    df['adm_cd'] = df['adm_cd'].astype(str)

    print("Loading Shapefile...")
    shp_path = get_shapefile_path()
    gdf = gpd.read_file(shp_path, encoding='euc-kr')
    
    # Filter Seoul (11...)
    gdf = gdf[gdf['ADM_CD'].str.startswith('11')].copy()

    # 2. Reproject to WGS84 (EPSG:4326) for Web Map
    print("Reprojecting to EPSG:4326...")
    gdf = gdf.to_crs("EPSG:4326")

    # 3. Merge
    print("Merging spatial data with slope statistics...")
    # gdf key: ADM_CD, csv key: adm_cd
    merged = gdf.merge(df, left_on='ADM_CD', right_on='adm_cd', how='left')
    
    # Fill NaN slopes with 0 (safe fallback)
    merged['mean_slope'] = merged['mean_slope'].fillna(0)
    merged['steep_ratio'] = merged['steep_ratio'].fillna(0)

    # 4. Cleanup & Select Columns
    # We keep Geometry, ADM_NM, ADM_CD, mean_slope, steep_ratio
    # Note: Use the column names from the merge (DataFrame handles name collisions if any)
    # GDF columns: ADM_CD, ADM_NM... CSV columns: adm_cd, adm_nm...
    # We prefer the CSV stats, but the GDF naming for ID/Name is standard.
    
    columns_to_keep = ['ADM_CD', 'ADM_NM', 'mean_slope', 'steep_ratio', 'geometry']
    # Check if ADM_NM exists, if not use adm_nm
    if 'ADM_NM' not in merged.columns and 'adm_nm' in merged.columns:
        merged['ADM_NM'] = merged['adm_nm']
    
    final_gdf = merged[columns_to_keep]

    # 5. Export
    print(f"Exporting to {OUTPUT_GEOJSON}...")
    # Use standard precision to save space, maybe? keep default.
    final_gdf.to_file(OUTPUT_GEOJSON, driver='GeoJSON')
    
    print("Done!")

if __name__ == "__main__":
    main()
