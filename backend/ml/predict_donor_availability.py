#!/usr/bin/env python3
"""
OptiBlood ML Model - Donor Availability Prediction (KNBTS Rules)
Predicts when a donor will be available for their next donation based on Kenya National Blood Transfusion Service rules
"""

import sys
import json
from datetime import datetime, timedelta

def calculate_next_donation(donor_data, donation_history):
    """
    Calculate next donation date based on KNBTS rules and donation history
    
    Args:
        donor_data: Dictionary containing donor information
            - gender: 'male', 'female', or 'other'
            - total_donations: int
        donation_history: List of donation dates (ISO strings), sorted by date (newest first)
    
    Returns:
        Dictionary with prediction results:
            - next_donation: ISO date string or None
            - status: "Available", "Wait X weeks", or "Not enough data"
            - message: Human-readable message
            - days_until_eligible: int or None
    """
    total_donations = donor_data.get('total_donations', 0)
    gender = donor_data.get('gender', 'other')
    today = datetime.now()
    
    # KNBTS Rules: Minimum wait periods
    if gender == 'male':
        MIN_WAIT_DAYS = 90  # 3 months
        MIN_WAIT_MONTHS = 3
    elif gender == 'female':
        MIN_WAIT_DAYS = 120  # 4 months
        MIN_WAIT_MONTHS = 4
    else:
        # Default to 3 months for 'other' or unknown
        MIN_WAIT_DAYS = 90
        MIN_WAIT_MONTHS = 3
    
    # Check if donor has enough donation history (need at least 2 donations)
    if total_donations < 2:
        return {
            'next_donation': None,
            'status': 'Not enough data',
            'message': f'Need at least 2 donations. Current: {total_donations}',
            'days_until_eligible': None,
            'knbts_rule': f'Men: {3 if gender == "male" else 4} months | Women: 4 months'
        }
    
    # Get last donation date
    last_donation = None
    if donation_history and len(donation_history) > 0:
        try:
            last_donation_str = donation_history[0]  # Most recent donation
            last_donation = datetime.fromisoformat(last_donation_str.replace('Z', '+00:00'))
            if last_donation.tzinfo:
                last_donation = last_donation.replace(tzinfo=None)
        except:
            pass
    
    if not last_donation:
        return {
            'next_donation': None,
            'status': 'Not enough data',
            'message': 'No donation history found',
            'days_until_eligible': None,
            'knbts_rule': f'Men: {3 if gender == "male" else 4} months | Women: 4 months'
        }
    
    # Calculate average interval from donation history
    if len(donation_history) >= 2:
        # Calculate intervals between consecutive donations
        intervals = []
        for i in range(len(donation_history) - 1):
            try:
                date1 = datetime.fromisoformat(donation_history[i].replace('Z', '+00:00'))
                date2 = datetime.fromisoformat(donation_history[i + 1].replace('Z', '+00:00'))
                if date1.tzinfo:
                    date1 = date1.replace(tzinfo=None)
                if date2.tzinfo:
                    date2 = date2.replace(tzinfo=None)
                interval_days = (date1 - date2).days
                if interval_days > 0:
                    intervals.append(interval_days)
            except:
                continue
        
        if intervals:
            avg_interval = sum(intervals) / len(intervals)
            # Use average interval, but ensure it's at least the KNBTS minimum
            predicted_interval = max(avg_interval, MIN_WAIT_DAYS)
        else:
            predicted_interval = MIN_WAIT_DAYS
    else:
        # Not enough history, use minimum wait period
        predicted_interval = MIN_WAIT_DAYS
    
    # Calculate next donation date
    next_donation_date = last_donation + timedelta(days=int(predicted_interval))
    
    # Calculate days until eligible
    days_until_eligible = (next_donation_date - today).days
    
    # Determine status
    if days_until_eligible <= 0:
        status = "Available"
        message = "Eligible to donate now"
    elif days_until_eligible <= 7:
        weeks = round(days_until_eligible / 7, 1)
        status = f"Wait {weeks} week{'s' if weeks > 1 else ''}"
        message = f"Eligible in {days_until_eligible} day{'s' if days_until_eligible > 1 else ''}"
    elif days_until_eligible <= 30:
        weeks = round(days_until_eligible / 7, 1)
        status = f"Wait {weeks} week{'s' if weeks > 1 else ''}"
        message = f"Eligible in {days_until_eligible} day{'s' if days_until_eligible > 1 else ''}"
    else:
        weeks = round(days_until_eligible / 7, 1)
        status = f"Wait {weeks} week{'s' if weeks > 1 else ''}"
        message = f"Eligible in {days_until_eligible} day{'s' if days_until_eligible > 1 else ''}"
    
    return {
        'next_donation': next_donation_date.isoformat().split('T')[0],
        'status': status,
        'message': message,
        'days_until_eligible': days_until_eligible,
        'knbts_rule': f'Men: 3 months | Women: 4 months',
        'predicted_interval_days': int(predicted_interval)
    }

def predict_donor_availability(donor_data):
    """
    Predict donor availability based on donation history and KNBTS rules
    
    Args:
        donor_data: Dictionary containing donor information and donation history
            - gender: 'male', 'female', or 'other'
            - total_donations: int
            - donation_history: List of donation dates (ISO strings)
    
    Returns:
        Dictionary with prediction results
    """
    donation_history = donor_data.get('donation_history', [])
    
    # Sort donation history by date (newest first)
    donation_history_sorted = sorted(donation_history, reverse=True)
    
    return calculate_next_donation(donor_data, donation_history_sorted)

def main():
    try:
        # Read input data from command line argument
        if len(sys.argv) < 2:
            raise ValueError("No input data provided")
        
        input_data = sys.argv[1]
        donor_data = json.loads(input_data)
        
        # Run prediction
        result = predict_donor_availability(donor_data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        # Output error as JSON
        error_result = {
            'error': str(e),
            'next_donation': None,
            'status': 'Error',
            'message': f'Prediction failed: {str(e)}',
            'days_until_eligible': None
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()

