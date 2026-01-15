import pandas as pd
from geopy.distance import geodesic
import time

def merge_and_deduplicate_cctv(seoul_csv, national_csv, output_csv):
    """
    Merges Seoul and National CCTV datasets with spatial deduplication (20m radius).
    
    Args:
        seoul_csv (str): Path to Seoul CCTV CSV (Master Data)
        national_csv (str): Path to National CCTV CSV (Target Data)
        output_csv (str): Path to save the result
    """
    print("Loading datasets...")
    # 1. Load Data
    # Assumes CSVs have columns: 'id', 'lat', 'lon', 'purpose' (Adjust based on actual schema)
    # Using 'ISO-8859-1' or 'cp949' usually for Korean CSVs, but using 'utf-8' as default here.
    try:
        seoul_df = pd.read_csv(seoul_csv)
        national_df = pd.read_csv(national_csv)
    except FileNotFoundError:
        print("Error: Input files not found. Please check paths.")
        return

    # 2. Preprocess & Standardize
    # Define Standard Structure: id, source, lat, lng, type
    
    # Process Master Data (Seoul)
    # Mapping columns (Mock logic - replace with actual column names)
    master_data = []
    print(f"Processing Master Data (Seoul): {len(seoul_df)} rows")
    
    for _, row in seoul_df.iterrows():
        # Clean/Validate coordinates
        try:
            lat = float(row.get('lat', 0))
            lng = float(row.get('lon', 0)) # Assuming 'lon' in source
            if lat == 0 or lng == 0: continue
            
            master_data.append({
                'id': f"TN_Seoul_{row.get('id', 'N/A')}",
                'source': 'Seoul',
                'lat': lat,
                'lng': lng,
                'type': row.get('purpose', 'Unknown'), # e.g., '방범용'
                'stats': row.get('pixel_count', None) # Example extra attribute for update logic
            })
        except ValueError:
            continue

    # 3. Spatial Deduplication Logic
    # We maintain the result list which initially contains all Seoul data.
    result_list = master_data.copy()
    
    print(f"Processing Target Data (National): {len(national_df)} rows")
    duplicates = 0
    added = 0
    updates = 0
    
    start_time = time.time()
    
    # Iterate National Data
    for idx, row in national_df.iterrows():
        if idx % 1000 == 0:
            print(f"Processed {idx}/{len(national_df)}...")

        try:
            lat = float(row.get('lat', 0))
            lng = float(row.get('lon', 0))
            if lat == 0 or lng == 0: continue
            
            target_point = (lat, lng)
            is_duplicate = False
            
            # --- Key Logic: Check against Result List ---
            # NOTE: For very large datasets (10k+), this O(N*M) loop is inefficient.
            # In production, use sklearn.neighbors.BallTree or cKDTree for O(logN) queries.
            # Here keeping strictly to the requested logic (Iterate & Compare).
            
            for existing_item in result_list:
                existing_point = (existing_item['lat'], existing_item['lng'])
                
                # Calculate Distance (meters)
                distance = geodesic(target_point, existing_point).meters
                
                if distance <= 20: # 20m Radius
                    is_duplicate = True
                    
                    # Update Logic: If existing item is missing info that target has
                    if not existing_item['stats'] and row.get('pixel_count'):
                        existing_item['stats'] = row.get('pixel_count')
                        updates += 1
                        
                    break # Stop checking, it's a duplicate
            
            if not is_duplicate:
                # Add as new unique point
                result_list.append({
                    'id': f"TN_National_{row.get('id', 'N/A')}",
                    'source': 'National',
                    'lat': lat,
                    'lng': lng,
                    'type': row.get('purpose', 'Unknown'),
                    'stats': row.get('pixel_count', None)
                })
                added += 1
            else:
                duplicates += 1
                
        except ValueError:
            continue

    # 4. Final Output
    print(f"\nMerging Compelted in {time.time() - start_time:.2f}s")
    print(f"Initial Master: {len(master_data)}")
    print(f"National Added: {added}")
    print(f"Duplicates Dropped: {duplicates}")
    print(f"Attributes Updated: {updates}")
    print(f"Final Count: {len(result_list)}")

    final_df = pd.DataFrame(result_list)
    final_df.to_csv(output_csv, index=False, encoding='utf-8-sig')
    print(f"Saved to {output_csv}")

# --- Execution Block (Mock Data Generation if run directly) ---
if __name__ == "__main__":
    # Create dummy files for demonstration
    dummy_seoul = pd.DataFrame({
        'id': [1, 2, 3],
        'lat': [37.4842, 37.4850, 37.4810],
        'lon': [126.9296, 126.9300, 126.9250],
        'purpose': ['Safety', 'Safety', 'Child'],
        'pixel_count': [None, '2MP', '5MP']
    })
    
    # Points: 
    # 1. Near Seoul #1 (Duplicate) -> Should drop/update
    # 2. Far away (New) -> Should add
    dummy_national = pd.DataFrame({
        'id': [101, 102],
        'lat': [37.4843, 37.5000],  # 37.4843 is very close to 37.4842 (~11m difference)
        'lon': [126.9296, 126.9400],
        'purpose': ['Street', 'Traffic'],
        'pixel_count': ['4MP', '2MP'] 
    })
    
    dummy_seoul.to_csv('dummy_seoul.csv', index=False)
    dummy_national.to_csv('dummy_national.csv', index=False)
    
    merge_and_deduplicate_cctv('dummy_seoul.csv', 'dummy_national.csv', 'merged_cctv_result.csv')
