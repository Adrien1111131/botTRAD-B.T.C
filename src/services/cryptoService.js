import binanceService from './binanceService';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Système de cache pour réduire les appels API
const cache = {
  price: { data: null, timestamp: 0 },
  history: { data: null, timestamp: 0 },
  sentiment: { data: null, timestamp: 0 }
};

// Durée de validité du cache en millisecondes
const CACHE_DURATION = {
  price: 30 * 1000, // 30 secondes
  history: 5 * 60 * 1000, // 5 minutes
  sentiment: 10 * 60 * 1000 // 10 minutes
};

class CryptoService {
  constructor() {
    // Indique quelle API utiliser en priorité
    this.preferredAPI = 'binance'; // 'coingecko' ou 'binance'
  }
  /**
   * Récupère le prix actuel du Bitcoin avec système de cache
   */
  async getBitcoinPrice() {
    try {
      // Vérifier le cache
      const now = Date.now();
      if (cache.price.data && now - cache.price.timestamp < CACHE_DURATION.price) {
        return cache.price.data;
      }
      
      let priceData = null;
      
      // Essayer avec l'API préférée d'abord
      if (this.preferredAPI === 'binance') {
        try {
          priceData = await binanceService.getBitcoinPrice();
        } catch (binanceError) {
          console.warn('Erreur Binance pour le prix, tentative avec CoinGecko:', binanceError);
        }
      }
      
      // Si Binance a échoué ou n'est pas l'API préférée, essayer CoinGecko
      if (!priceData) {
        try {
          const response = await fetch(`${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`);
          const data = await response.json();
          
          if (data && data.bitcoin && typeof data.bitcoin.usd === 'number') {
            priceData = {
              price: data.bitcoin.usd,
              change24h: data.bitcoin.usd_24h_change || 0
            };
          }
        } catch (coinGeckoError) {
          console.warn('Erreur CoinGecko pour le prix:', coinGeckoError);
        }
      }
      
      // Si les deux API ont échoué, utiliser des données simulées
      if (!priceData) {
        console.log('Utilisation du prix de secours');
        priceData = this.generateMockPrice();
      }
      
      // Mettre à jour le cache
      cache.price = {
        data: priceData,
        timestamp: now
      };
      
      return priceData;
    } catch (error) {
      console.error('Erreur lors de la récupération du prix:', error);
      return this.generateMockPrice();
    }
  }

  // Génère un prix simulé en cas d'échec de l'API
  generateMockPrice() {
    // Prix de base autour de 40000-45000
    const basePrice = 40000 + (Math.random() * 5000);
    // Variation sur 24h entre -5% et +5%
    const change24h = (Math.random() * 10) - 5;
    
    return {
      price: basePrice,
      change24h: change24h
    };
  }

  /**
   * Récupère l'historique des prix du Bitcoin avec système de cache
   */
  async getBitcoinHistory() {
    try {
      // Vérifier le cache
      const now = Date.now();
      if (cache.history.data && now - cache.history.timestamp < CACHE_DURATION.history) {
        return cache.history.data;
      }
      
      let historyData = null;
      
      // Essayer avec l'API préférée d'abord
      if (this.preferredAPI === 'binance') {
        try {
          historyData = await binanceService.getBitcoinHistory();
        } catch (binanceError) {
          console.warn('Erreur Binance pour l\'historique, tentative avec CoinGecko:', binanceError);
        }
      }
      
      // Si Binance a échoué ou n'est pas l'API préférée, essayer CoinGecko
      if (!historyData) {
        try {
          const response = await fetch(
            `${COINGECKO_API}/coins/bitcoin/market_chart?vs_currency=usd&days=1&interval=minute`
          );
          const data = await response.json();
          
          if (data && data.prices && Array.isArray(data.prices)) {
            historyData = data.prices.map(([timestamp, price]) => ({
              time: new Date(timestamp).toLocaleTimeString(),
              price: price,
              timestamp,
              volume: Math.random() * 100 // Volume simulé pour les calculs
            }));
          }
        } catch (coinGeckoError) {
          console.warn('Erreur CoinGecko pour l\'historique:', coinGeckoError);
        }
      }
      
      // Si les deux API ont échoué, utiliser des données simulées
      if (!historyData) {
        console.log('Utilisation des données historiques de secours');
        historyData = this.generateMockHistoricalData();
      }
      
      // Mettre à jour le cache
      cache.history = {
        data: historyData,
        timestamp: now
      };
      
      return historyData;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return this.generateMockHistoricalData();
    }
  }

  // Génère des données historiques simulées en cas d'échec de l'API
  generateMockHistoricalData() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const data = [];
    
    // Générer des données pour les dernières 24 heures
    for (let i = 0; i < 60; i++) {
      const timestamp = now - (oneDay * (60 - i) / 60);
      // Prix de base avec une tendance légèrement haussière
      const basePrice = 40000 + (i * 50);
      // Ajouter une variation aléatoire
      const randomVariation = (Math.random() - 0.5) * 1000;
      const price = basePrice + randomVariation;
      
      data.push({
        time: new Date(timestamp).toLocaleTimeString(),
        price: price,
        timestamp,
        volume: Math.random() * 100 + 50
      });
    }
    
    return data;
  }

  /**
   * Récupération des données de sentiment avec système de cache
   */
  async getSentimentData() {
    try {
      // Vérifier le cache
      const now = Date.now();
      if (cache.sentiment.data && now - cache.sentiment.timestamp < CACHE_DURATION.sentiment) {
        return cache.sentiment.data;
      }
      
      // Récupération des données de l'orderbook pour analyse du sentiment
      let orderBookData = null;
      try {
        orderBookData = await binanceService.getOrderBook();
      } catch (error) {
        console.warn('Erreur lors de la récupération du carnet d\'ordres:', error);
      }
      
      // Calcul du sentiment basé sur l'orderbook
      let fearGreedIndex = 50; // Valeur par défaut
      let socialSentiment = 'neutre';
      
      if (orderBookData) {
        // Calcul du ratio achat/vente
        const totalBidVolume = orderBookData.bids.reduce((sum, bid) => sum + bid.quantity, 0);
        const totalAskVolume = orderBookData.asks.reduce((sum, ask) => sum + ask.quantity, 0);
        
        const buyRatio = totalBidVolume / (totalBidVolume + totalAskVolume);
        
        // Conversion en indice de peur et d'avidité (0-100)
        fearGreedIndex = Math.floor(buyRatio * 100);
        
        // Détermination du sentiment social
        if (fearGreedIndex > 70) {
          socialSentiment = 'positif';
        } else if (fearGreedIndex < 30) {
          socialSentiment = 'négatif';
        } else {
          socialSentiment = 'neutre';
        }
      } else {
        // Simulation si les données de l'orderbook ne sont pas disponibles
        fearGreedIndex = Math.floor(Math.random() * 100);
        socialSentiment = Math.random() > 0.5 ? 'positif' : 'négatif';
      }
      
      const sentimentData = {
        fearGreedIndex,
        socialSentiment,
        trendStrength: Math.min(fearGreedIndex / 10, 10) // 0-10
      };
      
      // Mettre à jour le cache
      cache.sentiment = {
        data: sentimentData,
        timestamp: now
      };
      
      return sentimentData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données de sentiment:', error);
      
      // Données de secours
      return {
        fearGreedIndex: Math.floor(Math.random() * 100),
        socialSentiment: Math.random() > 0.5 ? 'positif' : 'négatif',
        trendStrength: Math.random() * 10
      };
    }
  }

  // Calcul des indicateurs techniques
  calculateIndicators(prices) {
    if (!prices || prices.length < 20) return {
      sma20: null,
      rsi: null,
      macd: null,
      bollinger: null,
      volume: null
    };

    const sma20 = this.calculateSMA(prices, 20);
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const bollinger = this.calculateBollinger(prices);
    const supports = this.findSupportLevels(prices);
    const resistances = this.findResistanceLevels(prices);
    const fibonacci = this.calculateFibonacciLevels(prices);
    const atr = this.calculateATR(prices, 14);

    return {
      sma20,
      rsi,
      macd,
      bollinger,
      supports,
      resistances,
      fibonacci,
      atr
    };
  }

  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    return prices
      .slice(-period)
      .reduce((sum, price) => sum + price, 0) / period;
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return null;
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * k) + (ema * (1 - k));
    }
    return ema;
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    if (!ema12 || !ema26) return null;

    const macd = ema12 - ema26;
    const signal = this.calculateEMA([...prices.slice(0, -9), macd], 9);
    
    return {
      macd,
      signal,
      histogram: macd - signal
    };
  }

  calculateBollinger(prices, period = 20, multiplier = 2) {
    if (prices.length < period) return null;

    const sma = this.calculateSMA(prices.slice(-period), period);
    const standardDeviation = Math.sqrt(
      prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
    );

    return {
      middle: sma,
      upper: sma + (multiplier * standardDeviation),
      lower: sma - (multiplier * standardDeviation)
    };
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  findSupportLevels(prices, lookback = 20) {
    const supports = [];
    for (let i = lookback; i < prices.length - lookback; i++) {
      if (this.isLocalMinimum(prices, i, lookback)) {
        supports.push(prices[i]);
      }
    }
    return supports.slice(-3); // Retourne les 3 derniers niveaux de support
  }

  findResistanceLevels(prices, lookback = 20) {
    const resistances = [];
    for (let i = lookback; i < prices.length - lookback; i++) {
      if (this.isLocalMaximum(prices, i, lookback)) {
        resistances.push(prices[i]);
      }
    }
    return resistances.slice(-3); // Retourne les 3 derniers niveaux de résistance
  }

  isLocalMinimum(prices, index, lookback) {
    const price = prices[index];
    for (let i = index - lookback; i < index; i++) {
      if (prices[i] < price) return false;
    }
    for (let i = index + 1; i < index + lookback; i++) {
      if (prices[i] < price) return false;
    }
    return true;
  }

  isLocalMaximum(prices, index, lookback) {
    const price = prices[index];
    for (let i = index - lookback; i < index; i++) {
      if (prices[i] > price) return false;
    }
    for (let i = index + 1; i < index + lookback; i++) {
      if (prices[i] > price) return false;
    }
    return true;
  }

  // Calcul des niveaux de Fibonacci
  calculateFibonacciLevels(prices) {
    if (prices.length < 10) return null;

    // Trouver le plus haut et le plus bas sur la période
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const diff = high - low;

    // Niveaux de Fibonacci standards
    return {
      level0: low, // 0%
      level236: low + diff * 0.236, // 23.6%
      level382: low + diff * 0.382, // 38.2%
      level50: low + diff * 0.5, // 50%
      level618: low + diff * 0.618, // 61.8%
      level786: low + diff * 0.786, // 78.6%
      level100: high // 100%
    };
  }

  // Calcul de l'ATR (Average True Range) pour la volatilité
  calculateATR(prices, period = 14) {
    if (prices.length < period + 1) return null;

    let trueRanges = [];
    for (let i = 1; i < prices.length; i++) {
      const high = prices[i];
      const low = prices[i-1];
      const previousClose = prices[i-1];
      
      // True Range = max(high - low, |high - previousClose|, |low - previousClose|)
      const tr1 = Math.abs(high - low);
      const tr2 = Math.abs(high - previousClose);
      const tr3 = Math.abs(low - previousClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    // Calcul de la moyenne des True Ranges
    return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
  }

  // Calcul du stop-loss dynamique basé sur l'ATR
  calculateDynamicStopLoss(currentPrice, atr, multiplier = 2, isBuy = true) {
    if (!atr) return null;
    
    // Pour un achat, le stop est en dessous du prix
    if (isBuy) {
      return currentPrice - (atr * multiplier);
    } 
    // Pour une vente, le stop est au-dessus du prix
    else {
      return currentPrice + (atr * multiplier);
    }
  }
}

export default new CryptoService();
