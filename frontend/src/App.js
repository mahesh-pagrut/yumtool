import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [ingredients, setIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [mealType, setMealType] = useState('any');
  const [cookingTime, setCookingTime] = useState('any');
  const [servings, setServings] = useState(4);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recipe');
  const [savedRecipes, setSavedRecipes] = useState([]);

  // Load saved recipes on component mount
  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  const fetchSavedRecipes = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/recipes`);
      const recipes = await response.json();
      setSavedRecipes(recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const addIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const toggleDietaryPreference = (pref) => {
    setDietaryPreferences(prev =>
      prev.includes(pref)
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          dietary_preferences: dietaryPreferences,
          meal_type: mealType,
          cooking_time: cookingTime,
          servings: servings
        }),
      });

      const recipe = await response.json();
      setGeneratedRecipe(recipe);
      fetchSavedRecipes(); // Refresh saved recipes
    } catch (error) {
      console.error('Error generating recipe:', error);
      alert('Error generating recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateMealPlan = async () => {
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/meal-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          dietary_preferences: dietaryPreferences,
          servings: servings
        }),
      });

      const plan = await response.json();
      setMealPlan(plan);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Error generating meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addIngredient();
    }
  };

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo', 'low-carb', 'dairy-free', 'nut-free'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Custom icon avatar */}
              <div className="flex items-center space-x-3">
                {/* Logo Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-md group hover:scale-105 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-white group-hover:text-yellow-300 transition-colors duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m2 8H7a2 2 0 01-2-2V7a2 2 0 012-2h2l1-2h4l1 2h2a2 2 0 012 2v11a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                {/* Logo Text */}
                <h1 className="text-2xl font-semibold text-gray-800 group-hover:text-transparent bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text transition-all duration-300">
                  YumTool
                </h1>
              </div>
            </div>

            <nav className="flex space-x-6">
              <button
                onClick={() => setActiveTab('recipe')}
                className={`px-4 py-2 rounded-full transition-all ${activeTab === 'recipe'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-purple-600'
                  }`}
              >
                Recipe Generator
              </button>
              <button
                onClick={() => setActiveTab('meal-plan')}
                className={`px-4 py-2 rounded-full transition-all ${activeTab === 'meal-plan'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-purple-600'
                  }`}
              >
                Meal Planner
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-4 py-2 rounded-full transition-all ${activeTab === 'saved'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-purple-600'
                  }`}
              >
                Saved Recipes
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1528712306091-ed0763094c98"
              alt="Modern cooking"
              className="w-full h-64 object-cover rounded-3xl shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/70 to-blue-600/70 rounded-3xl flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-4xl font-bold mb-4">AI-Powered Recipe Generation</h2>
                <p className="text-xl opacity-90">Transform your ingredients into delicious recipes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredient Input Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            What ingredients do you have?
          </h3>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter an ingredient..."
              className="flex-1 px-6 py-4 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-lg transition-all"
            />
            <button
              onClick={addIngredient}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
            >
              Add Ingredient
            </button>
          </div>

          {/* Ingredients Display */}
          {ingredients.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">Your Ingredients:</h4>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm"
                  >
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(index)}
                      className="text-purple-600 hover:text-purple-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dietary Preferences */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Dietary Preferences:</h4>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleDietaryPreference(option)}
                  className={`px-4 py-2 rounded-full transition-all ${dietaryPreferences.includes(option)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="any">Any</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cooking Time</label>
              <select
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="any">Any</option>
                <option value="quick">Quick (15 min)</option>
                <option value="medium">Medium (30 min)</option>
                <option value="long">Long (60+ min)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Servings</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value))}
                min="1"
                max="12"
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Generate Buttons */}
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={generateRecipe}
              disabled={loading || ingredients.length === 0}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating Recipe...' : 'Generate Recipe'}
            </button>
            <button
              onClick={generateMealPlan}
              disabled={loading || ingredients.length === 0}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl hover:from-green-700 hover:to-teal-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating Meal Plan...' : 'Generate 3-Day Meal Plan'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {activeTab === 'recipe' && generatedRecipe && (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Generated Recipe</h3>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold text-purple-800">{generatedRecipe.title}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="bg-purple-100 px-3 py-1 rounded-full">⏱️ {generatedRecipe.cooking_time}</span>
                  <span className="bg-blue-100 px-3 py-1 rounded-full">👥 {generatedRecipe.servings} servings</span>
                  <span className="bg-green-100 px-3 py-1 rounded-full">📊 {generatedRecipe.difficulty}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-lg font-semibold text-gray-700 mb-3">Ingredients:</h5>
                  <ul className="space-y-2">
                    {generatedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="text-lg font-semibold text-gray-700 mb-3">Instructions:</h5>
                  <ol className="space-y-2">
                    {generatedRecipe.instructions.map((instruction, index) => (
                      <li key={index} className="flex">
                        <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                          {index + 1}
                        </span>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {generatedRecipe.nutritional_info && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                  <h5 className="text-lg font-semibold text-gray-700 mb-3">Nutritional Information:</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(generatedRecipe.nutritional_info).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-sm text-gray-600 capitalize">{key}</div>
                        <div className="text-lg font-bold text-purple-700">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meal Plan Results */}
        {activeTab === 'meal-plan' && mealPlan && (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your 3-Day Meal Plan</h3>
            <div className="space-y-6">
              {Object.entries(mealPlan).map(([day, meals]) => (
                <div key={day} className="bg-white rounded-2xl p-6 shadow-lg">
                  <h4 className="text-xl font-bold text-purple-800 mb-4 capitalize">{day}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(meals).map(([mealType, meal]) => (
                      <div key={mealType} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
                        <h5 className="font-semibold text-gray-700 capitalize mb-2">{mealType}</h5>
                        <h6 className="text-purple-700 font-medium mb-2">{meal.title}</h6>
                        <p className="text-sm text-gray-600 mb-2">⏱️ {meal.cooking_time}</p>
                        <div className="text-sm text-gray-700">
                          <strong>Ingredients:</strong> {meal.ingredients.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Recipes */}
        {activeTab === 'saved' && (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Saved Recipes</h3>
            {savedRecipes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No saved recipes yet. Generate your first recipe to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRecipes.map((recipe) => (
                  <div key={recipe.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <img
                      src="https://images.unsplash.com/photo-1466637574441-749b8f19452f"
                      alt="Recipe"
                      className="w-full h-32 object-cover rounded-xl mb-4"
                    />
                    <h4 className="text-lg font-bold text-purple-800 mb-2">{recipe.title}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>⏱️ {recipe.cooking_time}</span>
                      <span>👥 {recipe.servings}</span>
                      <span>📊 {recipe.difficulty}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {recipe.ingredients.slice(0, 3).join(', ')}
                      {recipe.ingredients.length > 3 && '...'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {recipe.dietary_tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;