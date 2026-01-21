import os
import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt

# Configuration
DATA_DIR = os.path.join(os.getcwd(), 'data')
SHP_DIR = os.path.join(DATA_DIR, 'shp')
DERIVED_DIR = os.path.join(DATA_DIR, 'derived')
CSV_PATH = os.path.join(DERIVED_DIR, 'seoul_slope_complete.csv')
OUTPUT_IMG = os.path.join(DERIVED_DIR, 'seoul_slope_map.png')
TARGET_CRS = 'EPSG:5179'

def get_shapefile_path():
    p = os.path.join(SHP_DIR, 'BND_ADM_DONG.shp')
    if os.path.exists(p): return p
    p_pg = os.path.join(SHP_DIR, 'BND_ADM_DONG_PG.shp')
    if os.path.exists(p_pg): return p_pg
    raise FileNotFoundError("Shapefile not found")

def main():
    print("Starting Visualization...")
    
    # 1. Load Data
    print("Loading CSV...")
    df = pd.read_csv(CSV_PATH)
    
    print("Loading Shapefile...")
    shp_path = get_shapefile_path()
    gdf = gpd.read_file(shp_path, encoding='euc-kr')
    
    # Filter Seoul & Reproject
    gdf = gdf[gdf['ADM_CD'].str.startswith('11')].copy()
    if gdf.crs != TARGET_CRS:
        gdf = gdf.to_crs(TARGET_CRS)

    # 2. Merge
    # Ensure ADM_CD types match (string)
    df['adm_cd'] = df['adm_cd'].astype(str)
    gdf['ADM_CD'] = gdf['ADM_CD'].astype(str)
    
    # Check column match (ADM_CD vs adm_cd)
    merged = gdf.merge(df, left_on='ADM_CD', right_on='adm_cd', how='left')
    
    # 3. Top/Bottom 5
    print("\n[Top 5 Steepest Districts]")
    top5 = merged.sort_values(by='mean_slope', ascending=False).head(5)
    for idx, row in top5.iterrows():
        print(f"{row['adm_nm']} ({row['adm_cd']}): {row['mean_slope']:.2f} degrees")
        
    print("\n[Bottom 5 Flattest Districts]")
    bot5 = merged.sort_values(by='mean_slope', ascending=True).head(5)
    for idx, row in bot5.iterrows():
        print(f"{row['adm_nm']} ({row['adm_cd']}): {row['mean_slope']:.2f} degrees")

    # 4. Plot Heatmap
    print("\nGenerating Heatmap...")
    fig, ax = plt.subplots(1, 1, figsize=(12, 10))
    
    # Plot
    # cmap='RdYlGn_r' -> Red (High) to Green (Low). 
    # Wait, RdYlGn is Red(low)-Yellow-Green(high)? No.
    # Usually: Red is 'bad' (or hot), Green is 'good' (or cold) ?
    # Matplotlib RdYlGn: Red (low value usually?) -> Green (high value).
    # Let's verify standard maps.
    # RdYlGn: Red (0.0) -> Yellow -> Green (1.0).
    # We want Green=Flat (Low Slope), Red=Steep (High Slope).
    # So we want Low Value -> Green, High Value -> Red.
    # That is the Reverse of RdYlGn.
    # So 'RdYlGn_r' (Red->Yellow->Green reversed) should be Green->Yellow->Red.
    
    merged.plot(column='mean_slope', ax=ax, legend=True,
                legend_kwds={'label': "Mean Slope (degrees)"},
                cmap='RdYlGn_r',
                missing_kwds={'color': 'lightgrey'})
    
    ax.set_title('Seoul Mean Slope by District', fontsize=15)
    ax.set_axis_off()
    
    plt.savefig(OUTPUT_IMG, dpi=150, bbox_inches='tight')
    print(f"Saved heatmap to {OUTPUT_IMG}")
    
if __name__ == "__main__":
    main()
