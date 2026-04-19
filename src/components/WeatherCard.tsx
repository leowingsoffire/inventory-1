'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle,
  CloudFog, Wind, Thermometer, Droplets, Eye,
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  visibility: number;
}

const WEATHER_CONDITIONS = {
  sunny: { icon: Sun, color: 'text-yellow-400', bg: 'from-amber-500/20 to-orange-500/10', particles: '☀️' },
  cloudy: { icon: Cloud, color: 'text-gray-300', bg: 'from-gray-500/20 to-slate-500/10', particles: '☁️' },
  rainy: { icon: CloudRain, color: 'text-blue-400', bg: 'from-blue-500/20 to-accent-500/10', particles: '🌧️' },
  stormy: { icon: CloudLightning, color: 'text-purple-400', bg: 'from-purple-500/20 to-indigo-500/10', particles: '⛈️' },
  drizzle: { icon: CloudDrizzle, color: 'text-accent-400', bg: 'from-accent-500/20 to-blue-500/10', particles: '🌦️' },
  foggy: { icon: CloudFog, color: 'text-gray-400', bg: 'from-gray-500/20 to-slate-500/10', particles: '🌫️' },
  snowy: { icon: CloudSnow, color: 'text-white', bg: 'from-white/20 to-blue-500/10', particles: '❄️' },
  windy: { icon: Wind, color: 'text-teal-400', bg: 'from-teal-500/20 to-emerald-500/10', particles: '💨' },
} as const;

type ConditionKey = keyof typeof WEATHER_CONDITIONS;

function mapCondition(iconCode: string): ConditionKey {
  const code = iconCode?.substring(0, 2) || '01';
  const map: Record<string, ConditionKey> = {
    '01': 'sunny', '02': 'cloudy', '03': 'cloudy', '04': 'cloudy',
    '09': 'drizzle', '10': 'rainy', '11': 'stormy', '13': 'snowy', '50': 'foggy',
  };
  return map[code] || 'cloudy';
}

function RainDrops() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 bg-blue-400/40 rounded-full"
          style={{ left: `${10 + i * 12}%`, height: `${6 + Math.random() * 8}px` }}
          animate={{ y: ['-20%', '120%'], opacity: [0.7, 0] }}
          transition={{ duration: 0.8 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.15, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

function SunRays() {
  return (
    <motion.div
      className="absolute -top-2 -right-2 w-14 h-14 opacity-30"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 w-0.5 h-5 bg-yellow-400/60 origin-bottom"
          style={{ transform: `translate(-50%, -100%) rotate(${i * 45}deg)` }}
        />
      ))}
    </motion.div>
  );
}

function LightningFlash() {
  return (
    <motion.div
      className="absolute top-2 right-4 text-yellow-300 text-lg"
      animate={{ opacity: [0, 1, 0, 0, 1, 0] }}
      transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.1, 0.8, 0.85, 0.9] }}
    >
      ⚡
    </motion.div>
  );
}

function CloudFloat() {
  return (
    <motion.div
      className="absolute top-1 left-2 text-white/20 text-xs"
      animate={{ x: [0, 20, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    >
      ☁
    </motion.div>
  );
}

export default function WeatherCard() {
  const { lang } = useApp();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(async () => {
    try {
      // Use Open-Meteo (free, no API key needed) for Singapore coordinates
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=1.3521&longitude=103.8198&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia/Singapore'
      );
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      const current = data.current;

      // Map WMO weather codes to conditions
      const wmoCode = current.weather_code;
      let condition: ConditionKey = 'sunny';
      let description = 'Clear sky';
      if (wmoCode <= 1) { condition = 'sunny'; description = lang === 'en' ? 'Clear sky' : '晴天'; }
      else if (wmoCode <= 3) { condition = 'cloudy'; description = lang === 'en' ? 'Partly cloudy' : '多云'; }
      else if (wmoCode <= 48) { condition = 'foggy'; description = lang === 'en' ? 'Foggy' : '有雾'; }
      else if (wmoCode <= 57) { condition = 'drizzle'; description = lang === 'en' ? 'Drizzle' : '毛毛雨'; }
      else if (wmoCode <= 67) { condition = 'rainy'; description = lang === 'en' ? 'Rain' : '下雨'; }
      else if (wmoCode <= 77) { condition = 'snowy'; description = lang === 'en' ? 'Snow' : '下雪'; }
      else if (wmoCode <= 82) { condition = 'rainy'; description = lang === 'en' ? 'Rain showers' : '阵雨'; }
      else if (wmoCode <= 86) { condition = 'snowy'; description = lang === 'en' ? 'Snow showers' : '阵雪'; }
      else if (wmoCode >= 95) { condition = 'stormy'; description = lang === 'en' ? 'Thunderstorm' : '雷暴'; }

      setWeather({
        temp: Math.round(current.temperature_2m),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        condition,
        description,
        icon: String(wmoCode),
        visibility: 10,
      });
    } catch {
      // Fallback: typical Singapore weather
      setWeather({
        temp: 31,
        humidity: 78,
        windSpeed: 12,
        condition: 'cloudy',
        description: lang === 'en' ? 'Partly cloudy' : '多云',
        icon: '02',
        visibility: 10,
      });
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 600000); // Refresh every 10 min
    return () => clearInterval(weatherInterval);
  }, [fetchWeather]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sgTime = time.toLocaleTimeString('en-SG', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const sgDate = time.toLocaleDateString(lang === 'en' ? 'en-SG' : 'zh-SG', { timeZone: 'Asia/Singapore', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="h-8 glass-button px-2 py-1 flex items-center gap-1.5 animate-pulse">
        <div className="h-3 bg-white/10 rounded w-8" />
        <div className="h-3 bg-white/10 rounded w-12" />
      </div>
    );
  }

  const condKey = (weather?.condition || 'cloudy') as ConditionKey;
  const cond = WEATHER_CONDITIONS[condKey];
  const WeatherIcon = cond.icon;

  return (
    <motion.div
      className="relative glass-button overflow-hidden flex items-center gap-1.5 px-2.5 py-1.5"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      title={`${weather?.description} | ${lang === 'en' ? 'Humidity' : '湿度'}: ${weather?.humidity}% | ${lang === 'en' ? 'Wind' : '风速'}: ${weather?.windSpeed}km/h`}
    >
      {/* Background gradient based on weather */}
      <div className={`absolute inset-0 bg-gradient-to-r ${cond.bg} rounded-xl`} />

      <div className="relative flex items-center gap-1.5">
        {/* Location */}
        <span className="text-white/40 text-[9px]">🇸🇬</span>

        {/* Weather icon */}
        <motion.div
          animate={
            condKey === 'sunny'
              ? { rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }
              : condKey === 'rainy' || condKey === 'stormy'
              ? { y: [0, 1, 0] }
              : { x: [0, 2, -2, 0] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <WeatherIcon className={`w-3.5 h-3.5 ${cond.color}`} />
        </motion.div>

        {/* Temp */}
        <span className="text-xs font-semibold text-white">{weather?.temp}°C</span>

        {/* Divider */}
        <div className="w-px h-3 bg-white/10" />

        {/* Time */}
        <span className="text-white/50 text-[10px] font-mono">{sgTime}</span>
      </div>
    </motion.div>
  );
}
