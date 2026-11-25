import re
import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

# WMO Weather interpretation codes (WW)
WMO_WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}

WEATHER_INTENT_PATTERN = re.compile(
    r"\b(weather|temperature|forecast|rain|raining|snow|snowing|sunny|cloudy|wind|windy|humidity|how cold|how hot|climate|degrees)\b",
    re.IGNORECASE
)

CITY_EXTRACTION_PATTERN = re.compile(
    r"(?:weather|temperature|forecast|rain|climate)\s+(?:in|for|at|of)\s+([a-zA-Z\s,]+?)(?:\s+(?:today|tomorrow|now|right now|currently|\?|$)|$|\?|\.)",
    re.IGNORECASE
)

def get_weather_by_coords(lat: float, lon: float, location_label: str = "Current Location") -> Optional[str]:
    """Fetch current real-time weather from Open-Meteo for given coordinates."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
        f"&timezone=auto"
    )
    try:
        with httpx.Client(timeout=4.0) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                logger.warning("Open-Meteo API returned status %d", resp.status_code)
                return None
            data = resp.json()
            current = data.get("current")
            if not current:
                return None

            temp_c = current.get("temperature_2m")
            temp_f = round(temp_c * 9 / 5 + 32, 1) if temp_c is not None else None
            apparent_c = current.get("apparent_temperature")
            apparent_f = round(apparent_c * 9 / 5 + 32, 1) if apparent_c is not None else None
            humidity = current.get("relative_humidity_2m")
            precip = current.get("precipitation", 0.0)
            wind_kmh = current.get("wind_speed_10m")
            code = current.get("weather_code", 0)
            condition = WMO_WEATHER_CODES.get(code, "Clear")

            return (
                f"[LIVE REAL-TIME WEATHER DATA]\n"
                f"Location: {location_label} (Lat: {lat:.2f}, Lon: {lon:.2f})\n"
                f"Condition: {condition}\n"
                f"Temperature: {temp_c}°C ({temp_f}°F)\n"
                f"Feels like: {apparent_c}°C ({apparent_f}°F)\n"
                f"Humidity: {humidity}%\n"
                f"Precipitation: {precip} mm\n"
                f"Wind Speed: {wind_kmh} km/h\n"
                f"(Note for Askio: Provide this exact live weather data accurately and conversationally to the user.)"
            )
    except Exception as e:
        logger.warning("Error fetching weather by coords: %s", str(e))
        return None

def get_weather_by_city(city_name: str) -> Optional[str]:
    """Geocode a city and fetch its current weather from Open-Meteo."""
    cleaned_city = city_name.strip().strip("?.,!")
    if not cleaned_city:
        return None

    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={cleaned_city}&count=1"
    try:
        with httpx.Client(timeout=4.0) as client:
            resp = client.get(geo_url)
            if resp.status_code != 200:
                return None
            data = resp.json()
            results = data.get("results")
            if not results:
                return None

            top = results[0]
            lat = top.get("latitude")
            lon = top.get("longitude")
            name = top.get("name")
            country = top.get("country", "")
            location_label = f"{name}, {country}" if country else name

            if lat is not None and lon is not None:
                return get_weather_by_coords(lat, lon, location_label)
    except Exception as e:
        logger.warning("Error geocoding city '%s': %s", city_name, str(e))
        return None

    return None

def detect_and_get_weather_context(user_text: str, client_info: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """
    Detects if the user query asks about weather or conditions,
    and fetches real-time data using either extracted city or browser geolocation.
    """
    if not user_text or not WEATHER_INTENT_PATTERN.search(user_text):
        return None

    # Check if a city was explicitly mentioned (e.g. "weather in Tokyo")
    city_match = CITY_EXTRACTION_PATTERN.search(user_text)
    if city_match:
        city_candidate = city_match.group(1).strip()
        weather = get_weather_by_city(city_candidate)
        if weather:
            return weather

    # If no specific city mentioned (e.g. "current weather", "what's the weather today"),
    # check if client provided geolocation from browser permission
    client_info = client_info or {}
    location = client_info.get("location") or {}
    lat = location.get("latitude")
    lon = location.get("longitude")
    city_label = location.get("city") or "User's Detected Location"

    if lat is not None and lon is not None:
        try:
            return get_weather_by_coords(float(lat), float(lon), city_label)
        except (ValueError, TypeError):
            pass

    return None
