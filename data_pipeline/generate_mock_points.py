import geopandas as gpd
import pandas as pd
import numpy as np
from shapely.geometry import Point
from load_boundaries import process_boundaries
from schema_config import CRS_ANALYSIS, BuildingSchema, LicenseSchema, CCTVSchema

def generate_random_points_in_polygon(polygon, num_points):
    """
    Generate random points within a polygon.
    """
    points = []
    min_x, min_y, max_x, max_y = polygon.bounds
    while len(points) < num_points:
        random_point = Point([np.random.uniform(min_x, max_x), np.random.uniform(min_y, max_y)])
        if random_point.within(polygon):
            points.append(random_point)
    return points

def generate_mock_dataset():
    # 1. Load Boundaries (EPSG:5179)
    boundaries = process_boundaries()
    
    cctv_list = []
    infra_list = []
    building_list = []
    
    print("\n[Generating Mock Data]")
    for idx, row in boundaries.iterrows():
        is_target = row['is_target_zone']
        poly = row['geometry']
        adm_nm = row['ADM_NM']
        
        # Density Settings (Target vs Non-Target)
        # Using fixed counts for mock simplicity, representing density difference
        # Target: High Density, Non-Target: Low Density
        if is_target:
            c_count = 50   # CCTV
            i_count = 100  # Infra
            b_count = 200  # Buildings
        else:
            c_count = 10
            i_count = 20
            b_count = 50
            
        print(f" -> Generating for {adm_nm} (Target: {is_target}): CCTV={c_count}, Infra={i_count}, Bld={b_count}")
        
        # --- 1. CCTV Data ---
        points = generate_random_points_in_polygon(poly, c_count)
        for p in points:
            cctv_list.append({
                'geometry': p,
                CCTVSchema.INSTALL_PURPOSE: np.random.choice(['방범용', '다목적', '교통단속용'], p=[0.8, 0.1, 0.1]),
                'adm_nm': adm_nm
                # lat/lon columns are usually for WGS84, but we keep geometry in 5179. 
                # If needed, we can project back to WGS84 to fill these columns, 
                # but for analysis, geometry is key.
            })

        # --- 2. Infrastructure Data (License) ---
        points = generate_random_points_in_polygon(poly, i_count)
        types = ['편의점', '일반음식점', '단란주점', '병원', '약국']
        for p in points:
            infra_list.append({
                'geometry': p,
                LicenseSchema.TRD_STATE_GBN: '01', # 영업중만 생성
                'category': np.random.choice(types),
                'adm_nm': adm_nm
            })

        # --- 3. Building Data ---
        points = generate_random_points_in_polygon(poly, b_count)
        for p in points:
            # Random Year 1990-2024
            year = np.random.randint(1990, 2025)
            month = np.random.randint(1, 13)
            day = np.random.randint(1, 29)
            date_str = f"{year}{month:02d}{day:02d}"
            
            # Violate Y/N (Target Area might have slightly more? Random for now)
            is_viol = 'N'
            if np.random.random() < 0.1: # 10% Violation rate
                is_viol = 'Y'

            building_list.append({
                'geometry': p,
                BuildingSchema.USE_APR_DAY: date_str,
                BuildingSchema.VIOL_BLD_YN: is_viol,
                'adm_nm': adm_nm
            })

    # Convert to GeoDataFrames
    gdf_cctv = gpd.GeoDataFrame(cctv_list, crs=CRS_ANALYSIS)
    gdf_infra = gpd.GeoDataFrame(infra_list, crs=CRS_ANALYSIS)
    gdf_bld = gpd.GeoDataFrame(building_list, crs=CRS_ANALYSIS)
    
    print(f"\n[Generation Complete]")
    print(f"Total CCTV: {len(gdf_cctv)}")
    print(f"Total Infra: {len(gdf_infra)}")
    print(f"Total Buildings: {len(gdf_bld)}")
    
    return gdf_cctv, gdf_infra, gdf_bld

if __name__ == "__main__":
    cctv, infra, bld = generate_mock_dataset()
    
    print("\n[Sample CCTV]")
    print(cctv.head())
    print("\n[Sample Infra]")
    print(infra.head())
    print("\n[Sample Building]")
    print(bld.head())
