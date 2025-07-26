from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import asyncio
import json
from bson import ObjectId
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

app = FastAPI(title="Smart Recipe Tool")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
mongo_client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
db = mongo_client[os.getenv("DB_NAME")]
recipes_collection = db.recipes
user_preferences_collection = db.user_preferences

# Pydantic models
class Recipe(BaseModel):
    id: str
    title: str
    ingredients: List[str]
    instructions: List[str]
    cooking_time: str
    servings: int
    difficulty: str
    nutritional_info: Optional[dict] = None
    dietary_tags: List[str] = []

class RecipeRequest(BaseModel):
    ingredients: List[str]
    dietary_preferences: List[str] = []
    meal_type: Optional[str] = "any"
    cooking_time: Optional[str] = "any"
    servings: Optional[int] = 4

class UserPreferences(BaseModel):
    dietary_restrictions: List[str] = []
    favorite_cuisines: List[str] = []
    cooking_skill: str = "beginner"
    allergies: List[str] = []

# Initialize Gemini AI chat
def get_gemini_chat():
    return LlmChat(
        api_key=os.getenv("GEMINI_API_KEY"),
        session_id=str(uuid.uuid4()),
        system_message="""You are a professional chef and nutritionist AI assistant specializing in recipe creation. 
        Your expertise includes:
        - Creating delicious recipes from available ingredients
        - Adapting recipes for dietary restrictions and preferences
        - Providing nutritional analysis
        - Suggesting cooking techniques and tips
        - Meal planning and preparation advice
        
        Always respond with detailed, practical recipes that are easy to follow. Include cooking times, serving sizes, and difficulty levels.
        When providing nutritional information, be accurate and helpful."""
    ).with_model("gemini", "gemini-2.0-flash")

@app.get("/")
async def root():
    return {"message": "Smart Recipe Tool API"}

@app.post("/api/generate-recipe")
async def generate_recipe(request: RecipeRequest):
    try:
        # Create prompt for AI
        ingredients_str = ", ".join(request.ingredients)
        dietary_str = ", ".join(request.dietary_preferences) if request.dietary_preferences else "none"
        
        prompt = f"""Create a detailed recipe using these available ingredients: {ingredients_str}
        
        Dietary preferences: {dietary_str}
        Meal type: {request.meal_type}
        Cooking time preference: {request.cooking_time}
        Servings: {request.servings}
        
        Please provide the recipe in this exact JSON format:
        {{
            "title": "Recipe Name",
            "ingredients": ["ingredient 1", "ingredient 2", "..."],
            "instructions": ["step 1", "step 2", "..."],
            "cooking_time": "30 minutes",
            "servings": 4,
            "difficulty": "easy/medium/hard",
            "nutritional_info": {{
                "calories": "400 per serving",
                "protein": "25g",
                "carbs": "30g",
                "fat": "15g"
            }},
            "dietary_tags": ["vegetarian", "gluten-free", "etc"]
        }}
        
        Make sure the recipe is practical and uses primarily the provided ingredients. You can suggest common pantry staples like salt, pepper, oil, etc."""
        
        # Get AI response
        chat = get_gemini_chat()
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the response (assuming it returns clean JSON)
        import json
        try:
            # Try to extract JSON from response
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif response_text.startswith("```"):
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            recipe_data = json.loads(response_text)
            
            # Add unique ID
            recipe_data["id"] = str(uuid.uuid4())
            
            # Save to database
            await recipes_collection.insert_one(recipe_data)
            
            return recipe_data
            
        except json.JSONDecodeError:
            # If JSON parsing fails, create a basic response
            return {
                "id": str(uuid.uuid4()),
                "title": "Custom Recipe",
                "ingredients": request.ingredients,
                "instructions": ["Recipe generation in progress. Please try again."],
                "cooking_time": "30 minutes",
                "servings": request.servings,
                "difficulty": "medium",
                "nutritional_info": {"calories": "Calculating..."},
                "dietary_tags": request.dietary_preferences
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recipe: {str(e)}")

@app.get("/api/recipes")
async def get_recipes():
    try:
        recipes = await recipes_collection.find({}).to_list(50)
        return recipes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recipes: {str(e)}")

@app.get("/api/recipes/{recipe_id}")
async def get_recipe(recipe_id: str):
    try:
        recipe = await recipes_collection.find_one({"id": recipe_id})
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return recipe
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recipe: {str(e)}")

@app.post("/api/meal-plan")
async def generate_meal_plan(request: RecipeRequest):
    try:
        # Create prompt for meal planning
        ingredients_str = ", ".join(request.ingredients)
        dietary_str = ", ".join(request.dietary_preferences) if request.dietary_preferences else "none"
        
        prompt = f"""Create a 3-day meal plan using these available ingredients: {ingredients_str}
        
        Dietary preferences: {dietary_str}
        Servings per meal: {request.servings}
        
        Please provide a JSON response with breakfast, lunch, and dinner for 3 days:
        {{
            "day1": {{
                "breakfast": {{"title": "...", "ingredients": [...], "cooking_time": "..."}},
                "lunch": {{"title": "...", "ingredients": [...], "cooking_time": "..."}},
                "dinner": {{"title": "...", "ingredients": [...], "cooking_time": "..."}}
            }},
            "day2": {{...}},
            "day3": {{...}}
        }}
        
        Focus on variety and balanced nutrition using the available ingredients."""
        
        # Get AI response
        chat = get_gemini_chat()
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response
        import json
        try:
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif response_text.startswith("```"):
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            meal_plan = json.loads(response_text)
            return meal_plan
            
        except json.JSONDecodeError:
            return {
                "day1": {
                    "breakfast": {"title": "Simple Breakfast", "ingredients": request.ingredients[:3], "cooking_time": "15 min"},
                    "lunch": {"title": "Quick Lunch", "ingredients": request.ingredients[2:5], "cooking_time": "20 min"},
                    "dinner": {"title": "Healthy Dinner", "ingredients": request.ingredients[3:], "cooking_time": "30 min"}
                },
                "day2": {
                    "breakfast": {"title": "Nutritious Breakfast", "ingredients": request.ingredients[:4], "cooking_time": "15 min"},
                    "lunch": {"title": "Balanced Lunch", "ingredients": request.ingredients[1:4], "cooking_time": "25 min"},
                    "dinner": {"title": "Satisfying Dinner", "ingredients": request.ingredients[2:], "cooking_time": "35 min"}
                },
                "day3": {
                    "breakfast": {"title": "Energy Breakfast", "ingredients": request.ingredients[:3], "cooking_time": "10 min"},
                    "lunch": {"title": "Fresh Lunch", "ingredients": request.ingredients[3:6], "cooking_time": "20 min"},
                    "dinner": {"title": "Delicious Dinner", "ingredients": request.ingredients[4:], "cooking_time": "40 min"}
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating meal plan: {str(e)}")

@app.post("/api/user-preferences")
async def save_user_preferences(preferences: UserPreferences):
    try:
        pref_id = str(uuid.uuid4())
        pref_data = preferences.dict()
        pref_data["id"] = pref_id
        
        await user_preferences_collection.insert_one(pref_data)
        return {"id": pref_id, "message": "Preferences saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving preferences: {str(e)}")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "ai_enabled": bool(os.getenv("GEMINI_API_KEY"))}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)