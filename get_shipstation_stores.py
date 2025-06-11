#!/usr/bin/env python3
import requests
from requests.auth import HTTPBasicAuth
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SHIPSTATION_API_KEY = os.getenv("SHIPSTATION_API_KEY")
SHIPSTATION_API_SECRET = os.getenv("SHIPSTATION_API_SECRET")

def get_shipstation_stores():
    if not SHIPSTATION_API_KEY or not SHIPSTATION_API_SECRET:
        print("❌ ShipStation credentials not found in environment variables")
        return
    
    url = "https://ssapi.shipstation.com/stores"
    auth = HTTPBasicAuth(SHIPSTATION_API_KEY, SHIPSTATION_API_SECRET)
    
    try:
        response = requests.get(url, auth=auth)
        if response.status_code == 200:
            stores_data = response.json()
            print("📦 Available ShipStation Stores:")
            print("=" * 50)
            
            for store in stores_data:
                print(f"Store Name: {store.get('storeName', 'N/A')}")
                print(f"Store ID: {store.get('storeId', 'N/A')}")
                print(f"Marketplace: {store.get('marketplace', 'N/A')}")
                print(f"Active: {store.get('active', 'N/A')}")
                print("-" * 30)
                
            # Look for City Life Pharmacy specifically
            city_life_store = None
            for store in stores_data:
                if "City Life" in store.get('storeName', '') or "citylife" in store.get('storeName', '').lower():
                    city_life_store = store
                    break
            
            if city_life_store:
                print("\n🎯 Found City Life Pharmacy Store:")
                print(f"Store Name: {city_life_store.get('storeName')}")
                print(f"Store ID: {city_life_store.get('storeId')}")
                return city_life_store.get('storeId')
            else:
                print("\n⚠️ No 'City Life Pharmacy' store found in the list above")
                return None
                
        else:
            print(f"❌ ShipStation API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"⚠️ Exception getting ShipStation stores: {e}")
        return None

if __name__ == "__main__":
    get_shipstation_stores()