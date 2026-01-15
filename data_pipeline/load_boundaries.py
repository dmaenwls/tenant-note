import geopandas as gpd
import pandas as pd
from shapely.geometry import Polygon, Point
from schema_config import CRS_ANALYSIS, CRS_OUTPUT

def create_mock_seoul_data():
    """
    실제 SHP 파일이 없을 경우 테스트를 위해 가상의 서울시 데이터 생성
    """
    # 서울 중심부 대략적 좌표 (WGS84)
    # 11: 서울시 코드
    # 관악구: 11620, 서초구: 11650
    data = [
        # id, adm_nm, sig_cd, center_lon, center_lat
        ('11620101', '서원동', '11620', 126.929, 37.484), # 관악구
        ('11620102', '신원동', '11620', 126.930, 37.483), # 관악구
        ('11650101', '서초동', '11650', 127.008, 37.483), # 서초구
        ('11650102', '반포동', '11650', 126.995, 37.505), # 서초구
        ('11110101', '청운효자동', '11110', 126.970, 37.585) # 종로구 (타겟 아님)
    ]
    
    rows = []
    for adm_cd, adm_nm, sig_cd, lon, lat in data:
        # 간단한 사각형 폴리곤 생성 (0.01도 약 1km)
        poly = Polygon([
            (lon - 0.005, lat - 0.005),
            (lon + 0.005, lat - 0.005),
            (lon + 0.005, lat + 0.005),
            (lon - 0.005, lat + 0.005)
        ])
        rows.append({
            'ADM_CD': adm_cd,
            'ADM_NM': adm_nm,
            'SIG_CD': sig_cd,
            'geometry': poly
        })
        
    gdf = gpd.GeoDataFrame(rows, crs=CRS_OUTPUT) # 처음엔 WGS84로 생성
    return gdf

def process_boundaries():
    print("1. Loading Boundary Data...")
    # 실제 로드 로직: gdf = gpd.read_file("path/to/seoul.shp")
    # 여기서는 Mock 사용
    gdf = create_mock_seoul_data()
    print(f"   - Loaded {len(gdf)} regions.")

    print(f"2. Filtering Seoul Data (SIG_CD starts with 11)...")
    gdf = gdf[gdf['SIG_CD'].str.startswith('11')].copy()
    
    print(f"3. Reprojecting to {CRS_ANALYSIS}...")
    gdf_proj = gdf.to_crs(CRS_ANALYSIS)
    
    print("4. Marking Target Zones...")
    # 타겟: 관악구(11620), 서초구(11650) 의 특정 동
    target_conditions = (
        (gdf_proj['SIG_CD'] == '11620') & (gdf_proj['ADM_NM'].isin(['신림동', '서원동', '신원동'])) |
        (gdf_proj['SIG_CD'] == '11650') & (gdf_proj['ADM_NM'].isin(['서초동', '반포동']))
    )
    
    gdf_proj['is_target_zone'] = False
    gdf_proj.loc[target_conditions, 'is_target_zone'] = True
    
    target_count = gdf_proj['is_target_zone'].sum()
    print(f"   - Identified {target_count} target zones.")
    
    print("\n[Preview Data]")
    print(gdf_proj[['ADM_NM', 'is_target_zone', 'geometry']].head())
    
    return gdf_proj

if __name__ == "__main__":
    process_boundaries()
