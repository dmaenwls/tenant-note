import pandas as pd
import numpy as np
from aggregate_data import run_aggregation

def normalize_series(series, is_negative=False):
    """
    Min-Max Scaling.
    If is_negative is True, result is inverted (1 - scaled), so higher input means lower score.
    """
    min_val = series.min()
    max_val = series.max()
    
    if max_val == min_val:
        return pd.Series(1.0 if not is_negative else 0.0, index=series.index)
        
    scaled = (series - min_val) / (max_val - min_val)
    if is_negative:
        return 1.0 - scaled
    return scaled

def assign_grade(score, quantiles):
    """
    Assign Grade based on score percentile.
    quantiles: { 'A': 0.85, 'B': 0.55, 'C': 0.20 } -> These are cutoffs
    Score is assumed to be higher = better.
    """
    # Just simple rank based assignment
    # But usually we compare the score value against the percentile threshold values of the population
    pass 

def calculate_grades():
    # 1. Get Aggregated Data
    print("1. Fetching Aggregated Data...")
    df_admin, df_grid = run_aggregation()
    
    # Process Admin Level First
    print("\n2. Processing Admin District Grades...")
    
    # 2. Normalization
    # Indicators:
    # - cctv_count (Positive)
    # - harmful_count (Negative)
    # - viol_rate (Negative)
    # - avg_age (Negative)
    
    scores = pd.DataFrame(index=df_admin.index)
    scores['norm_cctv'] = normalize_series(df_admin['cctv_count'], is_negative=False)
    scores['norm_harm'] = normalize_series(df_admin['harmful_count'], is_negative=True)
    scores['norm_viol'] = normalize_series(df_admin['viol_rate'], is_negative=True)
    scores['norm_age'] = normalize_series(df_admin['avg_age'], is_negative=True)
    
    # 3. Weighted Score
    # Weights: Safety(30%), Property(25%), Comfort(15%), Etc(10%)
    # Total 80% mentioned, treating as sum score.
    
    w_safety = 0.30
    w_prop = 0.25
    w_comfort = 0.15
    w_etc = 0.10
    
    scores['final_score'] = (
        scores['norm_cctv'] * w_safety + 
        scores['norm_viol'] * w_prop + 
        scores['norm_harm'] * w_comfort + 
        scores['norm_age'] * w_etc
    )
    
    # 4. Grading
    # A: Top 15% (85th percentile)
    # B: Next 30% (55th percentile)
    # C: Next 35% (20th percentile)
    # D: Bottom 20%
    
    q85 = scores['final_score'].quantile(0.85)
    q55 = scores['final_score'].quantile(0.55)
    q20 = scores['final_score'].quantile(0.20)
    
    def get_grade(x):
        if x >= q85: return 'A'
        elif x >= q55: return 'B'
        elif x >= q20: return 'C'
        else: return 'D'
        
    df_admin['safety_score'] = scores['final_score'].round(3)
    df_admin['safety_grade'] = scores['final_score'].apply(get_grade)
    
    print("\n[Admin Safety Grades]")
    print(df_admin[['cctv_count', 'viol_rate', 'safety_score', 'safety_grade']].sort_values('safety_score', ascending=False))
    
    # Process Grid Level if exists
    if df_grid is not None:
        print("\n3. Processing Grid Cell Grades (Target Zones)...")
        # Same logic for grids
        g_scores = pd.DataFrame(index=df_grid.index)
        g_scores['norm_cctv'] = normalize_series(df_grid['cctv_count'], is_negative=False)
        g_scores['norm_viol'] = normalize_series(df_grid['viol_rate'], is_negative=True)
        g_scores['norm_age'] = normalize_series(df_grid['avg_age'], is_negative=True)
        # Grid usually doesn't have harmful count in this simple mock, assuming 0 or add logic. 
        # Using 0 for harmful if col missing or just omit weight?
        # Let's assume defaults for now.
        
        g_scores['final_score'] = (
            g_scores['norm_cctv'] * w_safety + 
            g_scores['norm_viol'] * w_prop + 
            # Comfort missing in grid aggregation previously? Let's check logic.
            # aggregate_data.py didn't map harmful_count to grid.
            # We'll skip comfort for grid or treat as 0 (perfect score).
            (1.0 * w_comfort) + 
            g_scores['norm_age'] * w_etc
        )
        
        # Grid Grading Thresholds might be different or same? Using relative to Grid population
        ga_q85 = g_scores['final_score'].quantile(0.85)
        ga_q55 = g_scores['final_score'].quantile(0.55)
        ga_q20 = g_scores['final_score'].quantile(0.20)
        
        def get_grid_grade(x):
            if x >= ga_q85: return 'A'
            elif x >= ga_q55: return 'B'
            elif x >= ga_q20: return 'C'
            else: return 'D'

        df_grid['safety_score'] = g_scores['final_score'].round(3)
        df_grid['safety_grade'] = g_scores['final_score'].apply(get_grid_grade)
        
        print("\n[Grid Safety Grades Preview]")
        print(df_grid[['ADM_NM', 'cctv_count', 'safety_score', 'safety_grade']].head())
    
    return df_admin, df_grid

if __name__ == "__main__":
    calculate_grades()
