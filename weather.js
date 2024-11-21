const apiKey = "547233e59b52916f4e45e9d04a83405f";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search-icon");
const locationBtn = document.querySelector(".location-btn");
const themeToggle = document.querySelector(".theme-toggle");
const weatherIcon = document.querySelector(".weather-icon");
const weatherDiv = document.querySelector(".weather");
const errorDiv = document.querySelector(".error");
const forecastContainer = document.querySelector(".forecast-container");

const tempValue = document.getElementById("temp-value");

// Load last searched location and theme from localStorage
const lastLocation = localStorage.getItem("lastLocation") || "London";
const savedTheme = localStorage.getItem("theme") || "dark";

// Set initial theme
document.body.className = savedTheme;

function toggleTheme() {
  const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
  document.body.className = newTheme;
  localStorage.setItem("theme", newTheme);
}

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

async function checkWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `${apiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric` // Always use metric for Celsius
    );

    if (!response.ok) throw new Error("Weather data not available");

    const data = await response.json();
    console.log("Weather data by coordinates:", data);

    localStorage.setItem("lastLocation", data.name);
    updateWeatherUI(data);

    const forecastResponse = await fetch(
      `${forecastUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric` // Always use metric for Celsius
    );

    if (!forecastResponse.ok) throw new Error("Forecast data not available");

    const forecastData = await forecastResponse.json();
    console.log("Forecast data by coordinates:", forecastData);
    updateForecast(forecastData.list);

    weatherDiv.style.display = "block";
    errorDiv.style.display = "none";
  } catch (error) {
    console.error("Error fetching weather:", error);
    errorDiv.style.display = "block";
    weatherDiv.style.display = "none";
  }
}

async function checkWeather(city) {
  try {
    localStorage.setItem("lastLocation", city);

    const response = await fetch(
      `${apiUrl}?q=${city}&appid=${apiKey}&units=metric` // Always use metric for Celsius
    );

    if (!response.ok) throw new Error("City not found");

    const data = await response.json();
    console.log("Weather data:", data);
    updateWeatherUI(data);

    const forecastResponse = await fetch(
      `${forecastUrl}?q=${city}&appid=${apiKey}&units=metric` // Always use metric for Celsius
    );

    if (!forecastResponse.ok) throw new Error("Forecast data not available");

    const forecastData = await forecastResponse.json();
    console.log("Forecast data:", forecastData);
    updateForecast(forecastData.list);

    weatherDiv.style.display = "block";
    errorDiv.style.display = "none";
  } catch (error) {
    console.error("Error fetching weather:", error);
    errorDiv.style.display = "block";
    weatherDiv.style.display = "none";
  }
}

function updateTimeAndDate(timezoneOffset) {
  const now = new Date();
  const localTime = new Date(now.getTime() + timezoneOffset * 1000);

  // Format date and time
  const formattedDate = localTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = localTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Update DOM
  document.getElementById("current-date").innerText = formattedDate;
  document.getElementById("current-time").innerText = formattedTime;
}

// Call the function repeatedly to update time
setInterval(() => {
  const timezoneOffset = localStorage.getItem("timezoneOffset") || 0;
  updateTimeAndDate(timezoneOffset);
}, 1000);


function updateWeatherUI(data) {
  document.querySelector(".city").innerHTML = `${data.name}, ${data.sys.country}`;
  tempValue.innerHTML = `${Math.round(data.main.temp)}°C`; // Always display in Celsius
  document.querySelector(".humidity").innerHTML = `${data.main.humidity}%`;
  document.querySelector(".wind").innerHTML = `${data.wind.speed} m/s`;
  document.querySelector(".visibility").innerHTML = `${(data.visibility / 1000).toFixed(1)}km`;
  document.querySelector(".cloudiness").innerHTML = `${data.clouds.all}%`;
  document.querySelector(".condition-text").innerHTML = data.weather[0].description;
  document.querySelector(".sunrise-time").innerHTML = formatTime(data.sys.sunrise);
  document.querySelector(".sunset-time").innerHTML = formatTime(data.sys.sunset);

  // Set weather icon
  if (data.weather && data.weather[0] && data.weather[0].icon) {
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
  } else {
    console.warn("Weather icon not found, falling back to default.");
    weatherIcon.src = "path/to/fallback-icon.png"; 
    weatherIcon.alt = "Weather icon not available";
  }
}



function updateForecast(forecastList) {
  forecastContainer.innerHTML = "";

  // Get the first forecast of each day (5-day forecast, one per day)
  const dailyForecasts = [];
  let lastDate = null;

  forecastList.forEach((forecast) => {
    const forecastDate = new Date(forecast.dt * 1000).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    if (forecastDate !== lastDate) {
      dailyForecasts.push(forecast);
      lastDate = forecastDate;
    }
  });

  // Limit the forecast to 5 days
  dailyForecasts.slice(0, 5).forEach((forecast) => {
    const forecastDay = document.createElement("div");
    forecastDay.className = "forecast-day";
    forecastDay.innerHTML = `
      <div class="forecast-date">${formatDate(forecast.dt)}</div>
      <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="${forecast.weather[0].description}">
      <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div> <!-- Celsius only -->
      <div class="forecast-condition">${forecast.weather[0].main}</div>
    `;
    forecastContainer.appendChild(forecastDay);
  });
}

// Event Listeners
locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Got coordinates:", latitude, longitude);
        checkWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        errorDiv.style.display = "block";
        weatherDiv.style.display = "none";
      }
    );
  } else {
    console.error("Geolocation is not supported");
    errorDiv.style.display = "block";
    weatherDiv.style.display = "none";
  }
});

searchBox.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    checkWeather(searchBox.value);
  }
});

searchBtn.addEventListener("click", () => {
  checkWeather(searchBox.value);
});

themeToggle.addEventListener("click", toggleTheme);

// Load last location and weather data on page load
checkWeather(lastLocation);
