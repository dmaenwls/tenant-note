import os
import time
import numpy as np
from dotenv import load_dotenv
from supabase import create_client, Client
from shapely import wkt
from pyproj import Transformer
from calculate_grade import calculate_grades
from generate_mock_points import generate_mock_dataset

# 1. Setup & Config
load_dotenv(dotenv_path='../.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key for writing

if not SUPABASE_URL or not SUPABASE_KEY:
    # Fallback to standard names if specific ones aren't found
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Coordinate Transformer: EPSG:5179 (Korea Central) -> EPSG:4326 (WGS84)
transformer = Transformer.from_crs("EPSG:5179", "EPSG:4326", always_xy=True)

def generate_mock_listings():
    print("1. Generating Mock Data & Grades...")
    # Get Grades for Districts
    df_admin, _ = calculate_grades()
    # Grade Map: ADM_NM -> Grade
    grade_map = df_admin['safety_grade'].to_dict()
    
    # Get Raw Building Data
    _, _, bld_gdf = generate_mock_dataset()
    print(f"   -> Generated {len(bld_gdf)} buildings.")

    listings = []
    
    print("2. Processing & Transforming Data...")
    for idx, row in bld_gdf.iterrows():
        # A. Coord Transform
        # pyproj transform: x, y -> lon, lat (because always_xy=True)
        x, y = row['geometry'].x, row['geometry'].y
        lon, lat = transformer.transform(x, y)
        
        # B. Create WKT (POINT(lon lat))
        location_wkt = f"POINT({lon} {lat})"
        
        # C. Mock Attributes
        adm_nm = row['adm_nm']
        grade = grade_map.get(adm_nm, 'C') # Default C
        
        # Mock Price (Deposit: 10m~1b won, Monthly: 300k~2m won)
        # Using BIGINT range
        price_deposit = int(np.random.randint(1000, 100000)) * 10000 # 10,000,000 ~ 1,000,000,000
        price_monthly = int(np.random.randint(30, 200)) * 10000 # 300,000 ~ 2,000,000
        
        listings.append({
            "location": location_wkt,
            "safety_grade": grade,
            "price_deposit": price_deposit,
            "price_monthly": price_monthly,
            "address": f"서울시 {adm_nm} {int(x)%1000}-{int(y)%100}번지", # Mock address
            "building_name": f"{adm_nm} 빌라 {idx}호", # Mock name
        })
        
    return listings

def upload_listings(data, batch_size=1000):
    total = len(data)
    print(f"\n3. Uploading {total} records to Supabase (Batch Size: {batch_size})...")
    
    for i in range(0, total, batch_size):
        batch = data[i:i+batch_size]
        try:
            response = supabase.table("listings").upsert(batch).execute()
            print(f"   -> Uploaded batch {i//batch_size + 1}/{total//batch_size + 1} ({len(batch)} rows)")
        except Exception as e:
            print(f"   [ERROR] Failed to upload batch {i}: {e}")
            
    print("\n[Upload Complete]")

if __name__ == "__main__":
    listings_data = generate_mock_listings()
    upload_listings(listings_data)
