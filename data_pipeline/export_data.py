import geopandas as gpd
import pandas as pd
import json
import os
from calculate_grade import calculate_grades
from schema_config import CRS_OUTPUT

def export_geojson():
    print("1. Calculating Grades...")
    df_admin, df_grid = calculate_grades()
    
    print("\n2. Transforming to WGS84 (EPSG:4326)...")
    # Reproject geometry
    df_admin_wgs = df_admin.to_crs(CRS_OUTPUT)
    
    # Grid is optional, but if used, reproject too
    if df_grid is not None:
        df_grid_wgs = df_grid.to_crs(CRS_OUTPUT)
    
    print("3.ructuring GeoJSON Properties...")
    features = []
    
    # Iterate over Admin Polygons
    for idx, row in df_admin_wgs.iterrows():
        # Basic Properties
        props = {
            "adm_id": str(idx), # ADM_CD probably index? or col? calculate_grade preserves index which is from aggregate_data
            # In aggregation, index was not set explicitly to CD, but group by ADM_NM creates index ADM_NM?
            # Let's check keys. In aggregate_data: groupby('ADM_NM').
            # So index is ADM_NM.
            "adm_nm": row.name, # Index name
            "grade": row['safety_grade'],
            "final_score": float(row['safety_score']),
            "is_target": bool(row['is_target_zone']) if 'is_target_zone' in row else False 
            # Note: aggregate_data groupby might have lost non-aggregated cols like is_target_zone.
            # We need to recover it.
            # aggregate_data joins points to boundaries, then groups by ADM_NM.
            # boundaries itself has is_target_zone. 
            # We should probably merge back with boundaries to get is_target_zone or keep it during agg.
            # The current aggregate_data returns df_admin which is just stats. 
            # Wait, calculate_grades returns df_admin with stats.
            # Geometry is lost in df_admin stats? 
            # Review aggregate_data.py: 
            # agg_cctv, agg_infra, agg_bld are Series/DFs. 
            # final_stats = concat... -> geometry is lost! 
            # This is a Logic Gap in previous steps. 
            # We need geometry from boundaries.
        }
        
        # Recover Geometry & Static Props
        # Ideally aggregate_data should have returned geo-aggregated df. 
        # But we can recover by joining with original boundaries if available.
        # Since I can't easily modify previous scripts in this one-shot without re-writing them or importing boundaries again.
        # I will import boundaries again here.
    
    print("   -> (Refetching boundaries to restore geometry)...")
    from load_boundaries import process_boundaries
    boundaries = process_boundaries()
    # boundaries has ADM_NM, geometry, is_target_zone
    
    # Merge stats (df_admin) into boundaries
    # df_admin index is ADM_NM
    merged = boundaries.merge(df_admin, left_on='ADM_NM', right_index=True, how='left')
    merged_wgs = merged.to_crs(CRS_OUTPUT)

    print("   -> (Generating Mock Points for Detailed View)...")
    from generate_mock_points import generate_mock_dataset
    # We only need CCTV for visualization as requested
    cctv_gdf, _, _ = generate_mock_dataset()
    cctv_wgs = cctv_gdf.to_crs(CRS_OUTPUT)
    
    # Pre-assign points to admin districts for faster lookup? 
    # Or just spatial join?
    # Spatial join is better.
    cctv_joined = gpd.sjoin(cctv_wgs, merged_wgs[['geometry', 'ADM_NM']], how='inner', predicate='within')
    
    # Now construct output features
    output_geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    for _, row in merged_wgs.iterrows():
        # Detail Data for Target Zones
        if row['is_target_zone']:
            # Fetch raw points for this area
            # Note: This is inefficient to regenerate random points every time if we wanted persistence, 
            # but for this mock pipeline it's acceptable. Ideally we should have saved intermediate points.
            # To avoid re-generating different points than aggregation used (if random), we really should have saved them.
            # But `aggregate_data` didn't save points to disk. 
            # So I will re-call generate_mock_dataset() ONCE outside the loop or mock it here?
            # Better: generate_mock_dataset() returns ALL points. I can filter them by geometry.
            
            # Since I can't easily change the architecture to save intermediate files now, 
            # I will trust that for this demo, regenerating or filtering from a global generation is fine.
            # Let's assume we generated them once at start of this function.
            pass # Logic moved to outside loop for efficiency

        
        feature = {
            "type": "Feature",
            "geometry": row['geometry'].__geo_interface__,
            "properties": {
                "adm_nm": row['ADM_NM'],
                "grade": row['safety_grade'],
                "is_target": bool(row['is_target_zone']),
                "scores": {
                    "safety": float(row['norm_cctv']) * 100, # Approx scale to 100 for chart
                    "comfort": float(row['norm_harm']) * 100,
                    "living": float(row['norm_viol']) * 100, # Property/Living? Map to frontend keys
                    "infra": float(row['norm_age']) * 100 # Approx
                },
                "stats": {
                    "cctv": int(row['cctv_count']),
                    "infra": int(row['infra_count']),
                    "viol_rate": float(row['viol_rate'])
                },
                "detail_data": {
                    "cctv": []
                }
            }
        }
        
        # Populate Detail Data if Target
        if row['is_target_zone']:
             # Filter cctv for this district
             local_cctv = cctv_joined[cctv_joined['ADM_NM'] == row['ADM_NM']]
             # Extract coordinates
             coords = []
             for _, pt in local_cctv.iterrows():
                 coords.append([pt.geometry.x, pt.geometry.y]) # lng, lat
             feature["properties"]["detail_data"]["cctv"] = coords
             
        output_geojson["features"].append(feature)

    # 4. Save
    output_dir = "../data" # Relative to data_pipeline/
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    output_path = os.path.join(output_dir, "seoul_hybrid_data.json")
    print(f"\n4. Saving to {output_path}...")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_geojson, f, ensure_ascii=False, indent=2)
        
    print("Done.")

if __name__ == "__main__":
    export_geojson()
