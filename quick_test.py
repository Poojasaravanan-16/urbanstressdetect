from supabase_config import SupabaseManager

print("Testing Supabase Connection...")
try:
    manager = SupabaseManager()
    print("SUCCESS: Supabase connected successfully!")
    print(f"   URL: {manager.url}")
    print(f"   Key: {manager.key[:20]}...")
except Exception as e:
    print(f"ERROR: Connection failed: {e}")