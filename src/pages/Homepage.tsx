import { useEffect } from "react";
import useGeolocation from "../hooks/useGeolocation";
import { useWeather } from "../hooks/useWeather";
import WeatherCard from "../components/WeatherCard";
import ForecastCard from "../components/ForecastCard";
import { formatTimeWithTimezone, weatherBackgrounds } from "../utils/weather";
import { FaLocationDot } from "react-icons/fa6";

function Homepage() {
  const { address } = useGeolocation();
  const {
    fetchWeather,
    weather,
    forecast,
    fetchForecast,
    loading,
    loadingForecast,
    error,
    errorForecast,
  } = useWeather();

  useEffect(() => {
    if (address) {
      fetchWeather(address);
      fetchForecast(address);
    }
  }, [address]);

  useEffect(() => {
    if (weather) {
      const weatherCondition = weather.weather[0].description.toLowerCase();
      const now = new Date(weather.dt * 1000);
      const sunsetTime = new Date(weather.sys.sunset * 1000);

      let background = "";
      if (
        weatherCondition.includes("clear sky") &&
        now.getTime() > sunsetTime.getTime()
      ) {
        background = "url('/night-sky.webp')";
      } else {
        background =
          weatherBackgrounds[
            weatherCondition as keyof typeof weatherBackgrounds
          ] || "url('/clear-sky.webp')";
      }

      const bg = document.getElementById("bg");
      if (bg) {
        bg.style.backgroundImage = background;
        bg.style.backgroundSize = "cover";
        bg.style.backgroundPosition = "center";
      }

      document.body.classList.remove(
        "weather-sunny",
        "weather-night",
        "weather-rainy",
        "weather-cloudy",
        "weather-misty",
        "weather-snowy"
      );

      if (weatherCondition.includes("clear") || weatherCondition.includes("sun")) {
        if (now.getTime() > sunsetTime.getTime()) {
          document.body.classList.add("weather-night");
        } else {
          document.body.classList.add("weather-sunny");
        }
      } else if (weatherCondition.includes("cloud")) {
        document.body.classList.add("weather-cloudy");
      } else if (weatherCondition.includes("rain")) {
        document.body.classList.add("weather-rainy");
      } else if (
        weatherCondition.includes("mist") ||
        weatherCondition.includes("smoke") ||
        weatherCondition.includes("fog") ||
        weatherCondition.includes("haze")
      ) {
        document.body.classList.add("weather-misty");
      } else if (weatherCondition.includes("snow")) {
        document.body.classList.add("weather-snowy");
      } else {
        document.body.classList.add("weather-night");
      }
    }
  }, [weather]);

  if (loading && loadingForecast) {
    return (
      <main className="flex justify-center items-center min-h-screen text-white">
        <div className="loader"></div>
      </main>
    );
  }

  return (
    <main>
      <div id="bg" className="bg fixed inset-0 z-[-1]"></div>
      <div className="space-y-4 flex flex-col min-h-[91dvh]">
        {weather && (
          <>
            <div className="flex items-center gap-2">
              <FaLocationDot size={30} className="text-green-400" />
              <div className="backdrop-blur-md">
                <h1 className="text-4xl font-bold text-blue-500">{weather.name}</h1>
                <p className="text-lg text-gray-300">
                  {new Date(weather.dt * 1000).toLocaleDateString()}{" "}
                  {formatTimeWithTimezone(weather.dt, weather.timezone)}
                </p>
              </div>
            </div>
            <WeatherCard weather={weather} />
          </>
        )}
        {forecast && <ForecastCard forecast={forecast} />}
        {error && <div className="flex-1 card p-4 mb-2">{error}</div>}
        {errorForecast && <div className="flex-1 card p-4 mt-2">{errorForecast}</div>}
      </div>
    </main>
  );
}

export default Homepage;
