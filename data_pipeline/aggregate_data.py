import geopandas as gpd
import pandas as pd
import numpy as np
from shapely.geometry import Polygon
from load_boundaries import process_boundaries
from generate_mock_points import generate_mock_dataset
from schema_config import CRS_ANALYSIS, BuildingSchema, LicenseSchema, CCTVSchema

def create_grid(polygon, cell_size=100):
    """
    Creates a grid of square polygons over a given polygon.
    cell_size: size in meters (since we are using EPSG:5179)
    """
    min_x, min_y, max_x, max_y = polygon.bounds
    x_coords = np.arange(min_x, max_x, cell_size)
    y_coords = np.arange(min_y, max_y, cell_size)
    
    grid_cells = []
    for x in x_coords:
        for y in y_coords:
            cell = Polygon([
                (x, y),
                (x + cell_size, y),
                (x + cell_size, y + cell_size),
                (x, y + cell_size)
            ])
            # Keep cell if it intersects with the original polygon
            if cell.intersects(polygon):
                grid_cells.append(cell)
                
    return gpd.GeoDataFrame(geometry=grid_cells, crs=CRS_ANALYSIS)

def calculate_building_age(date_str):
    """Simple helper to calc mock age"""
    try:
        year = int(str(date_str)[:4])
        return 2026 - year
    except:
        return 0

def run_aggregation():
    # 1. Load Data
    print("1. Loading & Generating Data...")
    boundaries = process_boundaries() # ADM_CD, ADM_NM, geometry, is_target_zone
    cctv, infra, bld = generate_mock_dataset()
    
    # 2. Pre-processing (Clean Data)
    print("2. Pre-processing...")
    # Filter only OPEN businesses (Already done in generation mostly, but strict check)
    infra = infra[infra[LicenseSchema.TRD_STATE_GBN] == '01'].copy()
    
    # Calc building age
    bld['age'] = bld[BuildingSchema.USE_APR_DAY].apply(calculate_building_age)
    
    # 3. Spatial Join (Points -> ADM)
    print("3. Spatial Join (Global)...")
    cctv_joined = gpd.sjoin(cctv, boundaries, how='inner', predicate='within')
    infra_joined = gpd.sjoin(infra, boundaries, how='inner', predicate='within')
    bld_joined = gpd.sjoin(bld, boundaries, how='inner', predicate='within')
    
    # 4. Global Aggregation (By ADM_CD/ADM_NM)
    print("4. Aggregating by Admin District...")
    
    # CCTV Count
    agg_cctv = cctv_joined.groupby('ADM_NM').size().rename('cctv_count')
    
    # Infra Stats
    # Count harmful businesses (Simple mock filter for '단란주점')
    infra_joined['is_harmful'] = infra_joined['category'].isin(['단란주점', '유흥주점'])
    agg_infra = infra_joined.groupby('ADM_NM').agg({
        'geometry': 'count',
        'is_harmful': 'sum'
    }).rename(columns={'geometry': 'infra_count', 'is_harmful': 'harmful_count'})
    
    # Building Stats
    # Violation Rate & Avg Age
    bld_joined['is_viol'] = bld_joined[BuildingSchema.VIOL_BLD_YN] == 'Y'
    agg_bld = bld_joined.groupby('ADM_NM').agg({
        'geometry': 'count',
        'is_viol': 'mean',
        'age': 'mean'
    }).rename(columns={'geometry': 'bld_count', 'is_viol': 'viol_rate', 'age': 'avg_age'})
    
    # Merge all results
    final_stats = pd.concat([agg_cctv, agg_infra, agg_bld], axis=1).fillna(0)
    print("\n[Admin District Aggregation Result]")
    print(final_stats)

    # 5. Target Zone Grid Analysis
    print("\n5. Target Zone Grid Analysis (100m)...")
    target_zones = boundaries[boundaries['is_target_zone']]
    
    all_grid_stats = []
    
    for idx, row in target_zones.iterrows():
        adm_nm = row['ADM_NM']
        print(f"   -> Analyzing Grid for {adm_nm}...")
        
        # Create Grid
        grid = create_grid(row['geometry'], cell_size=100)
        grid['ADM_NM'] = adm_nm
        
        # Spatial Join Grid -> Points
        # We join Points to Grid this time
        # Note: Using previously generated points limited to this polygon for efficiency? 
        # Or just global join. Global join is safer but slower. 
        # Using global points intersecting the specific Admin Polygon first to speed up.
        
        # Filter points for this admin area first to speed up sjoin
        local_cctv = cctv[cctv.geometry.within(row['geometry'])]
        local_bld = bld[bld.geometry.within(row['geometry'])]
        
        # Join
        grid_cctv = gpd.sjoin(local_cctv, grid, how='inner', predicate='within')
        grid_bld = gpd.sjoin(local_bld, grid, how='inner', predicate='within')
        
        # Aggregation per Grid Cell (using index_right)
        # Note: grid index is usually preserved in sjoin on left df if we do grid.sjoin(points)?
        # Let's do grid.sjoin(points) is usually right way if we want to keep grid geometry? 
        # Actually gpd.sjoin(left_df, right_df) keeps geometry of left.
        # So gpd.sjoin(grid, points) -> keeps grid geometry.
        
        # Count CCTV in Grid
        grid_cctv_counts = gpd.sjoin(grid, local_cctv, how='left', predicate='contains') \
                              .groupby(level=0).size().rename('cctv_count')
        # Fix: groupby size counts NaNs as 1 if not careful? 
        # Better: use count of a specific column.
        # But left join creates rows. If no match, index_right is NaN.
        
        # Let's use a simpler approach for stats: iterate is too slow for real data, but for mock okay.
        # Vectorized approach:
        join_c = gpd.sjoin(local_cctv, grid, how='inner', predicate='within')
        c_counts = join_c.groupby('index_right').size()
        
        join_b = gpd.sjoin(local_bld, grid, how='inner', predicate='within')
        join_b['is_viol'] = join_b[BuildingSchema.VIOL_BLD_YN] == 'Y'
        b_stats = join_b.groupby('index_right').agg({'is_viol': 'mean', 'age': 'mean'})
        
        # Map stats back to grid
        grid['cctv_count'] = grid.index.map(c_counts).fillna(0)
        grid['viol_rate'] = grid.index.map(b_stats['is_viol']).fillna(0)
        grid['avg_age'] = grid.index.map(b_stats['age']).fillna(0)
        
        all_grid_stats.append(grid)
        
    if all_grid_stats:
        final_grid_gdf = pd.concat(all_grid_stats)
        print(f"   -> Generated {len(final_grid_gdf)} grid cells.")
        print(final_grid_gdf[['ADM_NM', 'cctv_count', 'viol_rate', 'avg_age']].head())
        # Ideally save this to geojson
        # final_grid_gdf.to_file("data_pipeline/output_grid.geojson", driver='GeoJSON')
        
    return final_stats, final_grid_gdf if all_grid_stats else None

if __name__ == "__main__":
    run_aggregation()
