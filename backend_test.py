import requests
import sys
import json
from datetime import datetime

class SmartRecipeAPITester:
    def __init__(self, base_url="https://0bd5b722-10c5-49ab-b6cd-45c1a50a8e16.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out after {timeout} seconds")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_root_endpoint(self):
        """Test root endpoint"""
        return self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )

    def test_generate_recipe(self):
        """Test recipe generation with sample data"""
        sample_data = {
            "ingredients": ["chicken", "rice", "vegetables", "garlic", "onion"],
            "dietary_preferences": ["gluten-free"],
            "meal_type": "dinner",
            "cooking_time": "medium",
            "servings": 4
        }
        
        return self.run_test(
            "Generate Recipe",
            "POST",
            "api/generate-recipe",
            200,
            data=sample_data,
            timeout=60  # AI generation might take longer
        )

    def test_meal_plan_generation(self):
        """Test meal plan generation"""
        sample_data = {
            "ingredients": ["chicken", "rice", "vegetables", "garlic", "onion"],
            "dietary_preferences": ["gluten-free"],
            "servings": 4
        }
        
        return self.run_test(
            "Generate Meal Plan",
            "POST",
            "api/meal-plan",
            200,
            data=sample_data,
            timeout=60  # AI generation might take longer
        )

    def test_get_recipes(self):
        """Test getting all recipes"""
        return self.run_test(
            "Get All Recipes",
            "GET",
            "api/recipes",
            200
        )

    def test_save_user_preferences(self):
        """Test saving user preferences"""
        preferences_data = {
            "dietary_restrictions": ["gluten-free", "dairy-free"],
            "favorite_cuisines": ["italian", "asian"],
            "cooking_skill": "intermediate",
            "allergies": ["nuts"]
        }
        
        return self.run_test(
            "Save User Preferences",
            "POST",
            "api/user-preferences",
            200,
            data=preferences_data
        )

    def test_invalid_recipe_generation(self):
        """Test recipe generation with invalid data"""
        invalid_data = {
            "ingredients": [],  # Empty ingredients should cause error
            "dietary_preferences": ["gluten-free"],
            "meal_type": "dinner",
            "servings": 4
        }
        
        # This might return 200 with a fallback response or 400, let's see
        success, response = self.run_test(
            "Generate Recipe with Empty Ingredients",
            "POST",
            "api/generate-recipe",
            200,  # Backend might handle this gracefully
            data=invalid_data,
            timeout=30
        )
        
        # If it returns 200, check if it's a fallback response
        if success and isinstance(response, dict):
            if "error" in str(response).lower() or "try again" in str(response).lower():
                print("   ✅ Backend handled empty ingredients gracefully with fallback")
            else:
                print("   ⚠️  Backend processed empty ingredients - might need validation")
        
        return success, response

def main():
    print("🚀 Starting Smart Recipe Tool API Tests")
    print("=" * 50)
    
    # Setup
    tester = SmartRecipeAPITester()
    
    # Test sequence
    print("\n📋 Running Basic Connectivity Tests...")
    
    # 1. Basic health and connectivity
    tester.test_root_endpoint()
    tester.test_health_check()
    
    print("\n📋 Running Core API Tests...")
    
    # 2. Core functionality tests
    tester.test_get_recipes()
    tester.test_save_user_preferences()
    
    print("\n📋 Running AI Integration Tests...")
    
    # 3. AI-powered features (these might take longer)
    tester.test_generate_recipe()
    tester.test_meal_plan_generation()
    
    print("\n📋 Running Edge Case Tests...")
    
    # 4. Edge cases
    tester.test_invalid_recipe_generation()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} test(s) failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())