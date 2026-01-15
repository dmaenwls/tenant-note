"""
Data Pipeline Configuration & Schema Definitions
Project: Tenant Note - Safety Grade Analysis
"""

# 1. Coordinate Reference Systems (CRS)
CRS_ANALYSIS = 'EPSG:5179'  # 중부원점 (TM) - 거리 계산 및 면적 분석용
CRS_OUTPUT = 'EPSG:4326'    # WGS84 - 웹/앱 출력용 (카카오맵 등)

# 2. Schema Definitions (Standard Column Names)
class BuildingSchema:
    """건축물대장 표제부 스키마"""
    USE_APR_DAY = 'use_apr_day'      # 사용승인일
    VIOL_BLD_YN = 'viol_bld_yn'      # 위반건축물여부
    # 추가 권장 컬럼
    OTHER_USE_YN = 'other_use_yn'    # 타용도 기재 여부 (근생 빌라 등 식별)

class LicenseSchema:
    """인허가 정보(식품, 공중위생 등) 스키마"""
    OPN_SF_TEAM_CODE = 'opn_sf_team_code' # 개방자치단체코드
    TRD_STATE_GBN = 'trd_state_gbn'       # 영업상태구분코드 (01:영업, 02:휴업, 03:폐업 등)

class CCTVSchema:
    """서울시 안심이 CCTV 스키마"""
    LAT = 'wgs84_lat'               # 위도
    LON = 'wgs84_lon'               # 경도
    INSTALL_PURPOSE = 'install_purpose' # 설치목적 (방범, 불법주정차, etc)

# 3. Mappings (Optional: For data transformation references)
TRD_STATE_MAP = {
    '01': 'OPEN',
    '02': 'HOLIDAY',
    '03': 'CLOSED'
}
