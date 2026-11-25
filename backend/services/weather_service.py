import re
import logging
from typing import Dict, Any, Optional, Tuple
import httpx

logger = logging.getLogger(__name__)

# WMO Weather interpretation codes
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

WEATHER_KEYWORDS = re.compile(
    r"\b(weather|temperature|forecast|rain|raining|snow|snowing|sunny|cloudy|wind|windy|humidity|how cold|how hot|climate|temp|degrees)\b",
    re.IGNORECASE
)

# Cached IP location to avoid repetitive queries
_cached_ip_location: Optional[Dict[str, Any]] = None

def get_ip_fallback_location() -> Optional[Dict[str, Any]]:
    """Attempts to automatically detect user's city and coordinates via IP address."""
    global _cached_ip_location
    if _cached_ip_location:
        return _cached_ip_location

    try:
        with httpx.Client(timeout=3.0) as client:
            resp = client.get("http://ip-api.com/json/?fields=status,city,regionName,country,lat,lon")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "success":
                    city = data.get("city", "")
                    country = data.get("country", "")
                    label = f"{city}, {country}" if country else city
                    _cached_ip_location = {
                        "latitude": data.get("lat"),
                        "longitude": data.get("lon"),
                        "city": label
                    }
                    logger.info("Auto-detected client location via IP: %s", label)
                    return _cached_ip_location
    except Exception as e:
        logger.warning("IP geolocation lookup failed: %s", str(e))

    return None

def extract_city_candidate(query: str) -> Optional[str]:
    """
    Extracts city candidate from queries like:
    - 'weather in ahmedabad'
    - 'ahmedabad weather'
    - 'how is the weather in tokyo'
    - 'mumbai temperature'
    - 'weather for new york'
    """
    cleaned = query.strip().rstrip("?.,!")

    # Pattern 1: 'weather in/for/at/of <city>'
    m = re.search(r"(?:weather|temperature|forecast|climate)\s+(?:in|for|at|of)\s+([a-zA-Z\s,]+?)(?:\s+(?:today|tomorrow|now|currently|\?|$)|$|\?|\.)", cleaned, re.IGNORECASE)
    if m:
        return m.group(1).strip()

    # Pattern 2: '<city> weather/temperature/forecast' (e.g. 'ahmedabad weather', 'paris forecast')
    m = re.search(r"^([a-zA-Z\s,]+?)\s+(?:weather|temperature|forecast|climate|temp)", cleaned, re.IGNORECASE)
    if m:
        candidate = m.group(1).strip()
        # Ensure it's not a filler word like 'current', 'today', 'live'
        if candidate.lower() not in {"current", "today", "live", "local", "my", "the", "what is", "how is"}:
            return candidate

    # Pattern 3: Strip non-city keywords if user typed something like 'ahmedabad weather today' or 'weather tokyo'
    stop_words = {
        "what", "is", "the", "current", "weather", "temperature", "forecast", "climate", "today",
        "now", "right", "like", "how", "hows", "in", "for", "at", "of", "tell", "me", "about",
        "please", "can", "you", "check", "show", "temp", "give"
    }
    words = re.findall(r"[a-zA-Z]+", cleaned.lower())
    filtered = [w for w in words if w not in stop_words]
    if 1 <= len(filtered) <= 3:
        return " ".join(filtered)

    return None

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
            condition = WMO_WEATHER_CODES.get(code, "Clear sky")

            return (
                f"[LIVE REAL-TIME WEATHER DATA FOR {location_label.upper()}]\n"
                f"- Location: {location_label}\n"
                f"- Condition: {condition}\n"
                f"- Temperature: {temp_c}°C ({temp_f}°F)\n"
                f"- Feels Like: {apparent_c}°C ({apparent_f}°F)\n"
                f"- Relative Humidity: {humidity}%\n"
                f"- Wind Speed: {wind_kmh} km/h\n"
                f"- Precipitation: {precip} mm\n\n"
                f"CRITICAL INSTRUCTION FOR ASKIO: You HAVE real-time data for this location right now. "
                f"Directly present this live temperature, condition, humidity, and details accurately. "
                f"DO NOT say you lack real-time data."
            )
    except Exception as e:
        logger.warning("Error fetching weather for (%f, %f): %s", lat, lon, str(e))
        return None

def get_weather_by_city(city_name: str) -> Optional[str]:
    """Geocode a city and fetch its current weather from Open-Meteo."""
    cleaned = city_name.strip()
    if not cleaned or len(cleaned) < 2:
        return None

    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={cleaned}&count=1"
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
    and fetches live real-time data using:
    1. Extracted city name from query (e.g. 'ahmedabad weather', 'weather in tokyo')
    2. Browser geolocation coordinates if granted
    3. Auto-detected IP location fallback (e.g. Ahmedabad, India)
    """
    if not user_text or not WEATHER_KEYWORDS.search(user_text):
        return None

    # Step 1: Check if a city was mentioned in the query
    city_candidate = extract_city_candidate(user_text)
    if city_candidate:
        logger.info("Detected city candidate in weather query: '%s'", city_candidate)
        weather = get_weather_by_city(city_candidate)
        if weather:
            return weather

    # Step 2: If no specific city (e.g. 'current weather', 'how hot is it'), check browser location
    client_info = client_info or {}
    location = client_info.get("location") or {}
    lat = location.get("latitude")
    lon = location.get("longitude")
    city_label = location.get("city") or "Your Current Location"

    if lat is not None and lon is not None:
        try:
            return get_weather_by_coords(float(lat), float(lon), city_label)
        except (ValueError, TypeError):
            pass

    # Step 3: Fallback to auto-detected IP location (seamless for user!)
    ip_loc = get_ip_fallback_location()
    if ip_loc:
        ip_lat = ip_loc.get("latitude")
        ip_lon = ip_loc.get("longitude")
        ip_city = ip_loc.get("city") or "Your Local Area"
        if ip_lat is not None and ip_lon is not None:
            return get_weather_by_coords(ip_lat, ip_lon, ip_city)

    return None
