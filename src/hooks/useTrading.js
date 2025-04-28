import { useState, useEffect, useCallback, useRef } from 'react';
import grokService from '../services/grokService';
import cryptoService from '../services/cryptoService';
import analysisService from '../services/analysisService';
import binanceService from '../services/binanceService';
import predictionService from '../services/predictionService';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 secondes

const useTrading = () => {
  const [bitcoinData, setBitcoinData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [indicators, setIndicators] = useState({
    sma20: null,
    rsi: null,
    macd: null,
    bollinger: null,
    supports: [],
    resistances: [],
    fibonacci: null,
    atr: null,
    rsiDivergence: null,
    manipulation: null,
    confluence: null
  });
  const [sentiment, setSentiment] = useState({
    fearGreedIndex: 50,
    socialSentiment: 'neutre',
    trendStrength: 5
  });
  const [riskManagement, setRiskManagement] = useState({
    stopLoss: null,
    takeProfit: null,
    riskRewardRatio: null
  });
  const [tradingSignal, setTradingSignal] = useState({
    signal: 'ATTENDRE',
    confidence: 0,
    reason: 'Initialisation...'
  });
  
  const [prediction, setPrediction] = useState({
    direction: 'NEUTRE',
    confidence: 0,
    priceRanges: {
      oneHour: { min: 0, max: 0, confidence: 0 },
      fourHours: { min: 0, max: 0, confidence: 0 }
    },
    keyLevels: {
      support: [],
      resistance: [],
      targets: []
    },
    reasons: [],
    risks: []
  });
  const [signalHistory, setSignalHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Référence pour suivre les tentatives de retry
  const retryCount = useRef(0);
  const lastUpdateTime = useRef(Date.now());

  // Validation des données
  const validatePriceData = (data) => {
    if (!data || typeof data.price !== 'number' || typeof data.change24h !== 'number') {
      throw new Error('Données de prix invalides');
    }
    return data;
  };

  const validateHistoryData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Données historiques invalides');
    }
    return data;
  };

  // Fonction pour mettre à jour les données avec retry
  const fetchWithRetry = async (fetchFunction, validateFunction, errorMessage) => {
    let lastError;

    for (let i = 0; i <= retryCount.current; i++) {
      try {
        const data = await fetchFunction();
        return validateFunction(data);
      } catch (err) {
        lastError = err;
        console.error(`Tentative ${i + 1}/${MAX_RETRY_ATTEMPTS} échouée:`, err);
        if (i < MAX_RETRY_ATTEMPTS - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    throw new Error(`${errorMessage}: ${lastError.message}`);
  };

  // Fonction pour mettre à jour les données
  const updateData = useCallback(async () => {
    try {
      setIsLoading(true);
      retryCount.current = 0;

      // Vérification du délai minimum entre les mises à jour
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime.current;
      if (timeSinceLastUpdate < 5000) { // 5 secondes minimum entre les mises à jour
        return;
      }
      
      // Mise à jour de l'API préférée depuis localStorage
      const preferredAPI = localStorage.getItem('preferredAPI');
      if (preferredAPI) {
        cryptoService.preferredAPI = preferredAPI;
      }
      
      // Récupération du prix actuel avec retry
      const priceData = await fetchWithRetry(
        cryptoService.getBitcoinPrice.bind(cryptoService),
        validatePriceData,
        'Erreur lors de la récupération du prix'
      );
      setCurrentPrice(priceData.price);
      setPriceChange24h(priceData.change24h);

      // Récupération de l'historique avec retry
      const history = await fetchWithRetry(
        cryptoService.getBitcoinHistory.bind(cryptoService),
        validateHistoryData,
        'Erreur lors de la récupération de l\'historique'
      );
      
      // Vérification des données
      console.log('Données historiques reçues:', history);
      if (history && Array.isArray(history) && history.length > 0) {
        setBitcoinData(history);
      } else {
        console.warn('Données historiques invalides:', history);
        // Générer des données de secours si les données sont invalides
        const mockData = cryptoService.generateMockHistoricalData();
        setBitcoinData(mockData);
      }

      // Récupération des données de sentiment
      try {
        const sentimentData = await cryptoService.getSentimentData();
        setSentiment(sentimentData);
      } catch (sentimentErr) {
        console.error('Erreur lors de la récupération des données de sentiment:', sentimentErr);
        // On continue même si les données de sentiment échouent
      }

      // Calcul des indicateurs de base
      const prices = history.map(d => d.price);
      const volumes = history.map(d => d.volume || 0); // Simulation de volume si non disponible
      const technicalIndicators = cryptoService.calculateIndicators(prices);

      // Analyse avancée
      const rsiDivergence = analysisService.detectRSIDivergence(
        prices,
        technicalIndicators.rsi ? [technicalIndicators.rsi] : []
      );

      const manipulation = analysisService.detectMarketManipulation(prices, volumes);

      const confluence = analysisService.analyzeSignalConfluence(
        { ...technicalIndicators, currentPrice: priceData.price },
        manipulation,
        { supports: technicalIndicators.supports, resistances: technicalIndicators.resistances }
      );

      setIndicators({
        ...technicalIndicators,
        rsiDivergence,
        manipulation,
        confluence
      });

      // Calcul de la gestion du risque
      if (technicalIndicators.atr) {
        // Ajustement du multiplicateur ATR basé sur la volatilité et la manipulation
        const atrMultiplier = manipulation.isManipulated ? 3 : 2;
        const stopLoss = cryptoService.calculateDynamicStopLoss(
          priceData.price, 
          technicalIndicators.atr,
          atrMultiplier,
          confluence.signal === 'ACHETER'
        );
        
        // Take profit basé sur un ratio risque/récompense de 2:1
        const riskAmount = Math.abs(priceData.price - stopLoss);
        const takeProfit = tradingSignal.signal === 'ACHETER' 
          ? priceData.price + (riskAmount * 2)
          : priceData.price - (riskAmount * 2);
        
        setRiskManagement({
          stopLoss,
          takeProfit,
          riskRewardRatio: 2 // 2:1
        });
      }

      // Analyse avec Grok en incluant les nouvelles données
      const analysis = await grokService.analyzeMarket(
        priceData.price,
        history,
        {
          ...technicalIndicators,
          rsiDivergence,
          manipulation,
          confluence
        },
        sentiment
      );
      
      // Si le signal a changé et n'est pas manipulé, l'ajouter à l'historique
      if (analysis.signal !== tradingSignal.signal && !manipulation.isManipulated) {
        setSignalHistory(prev => [
          ...prev, 
          {
            time: new Date().toLocaleString(),
            signal: analysis.signal,
            price: priceData.price,
            confidence: analysis.confidence
          }
        ].slice(-10)); // Garder les 10 derniers signaux
      }
      
      // Calcul des prédictions
      const marketPrediction = predictionService.calculatePrediction(
        priceData.price,
        {
          ...technicalIndicators,
          rsiDivergence,
          manipulation,
          confluence,
          currentPrice: priceData.price
        },
        sentiment
      );
      setPrediction(marketPrediction);

      // Fusion des signaux de Grok et de l'analyse de confluence
      const finalSignal = {
        ...analysis,
        confidence: manipulation.isManipulated ? 
          0 : // Si manipulation détectée, confiance = 0
          (analysis.confidence + confluence.strength + marketPrediction.confidence) / 3, // Moyenne des confiances
        reason: `${analysis.reason}\n\n${manipulation.isManipulated ? 
          'ATTENTION: Manipulation de marché détectée - ' + manipulation.details.join(', ') : 
          confluence.reasons.join(', ')}\n\nPrédiction: ${marketPrediction.direction} (${(marketPrediction.confidence * 100).toFixed(1)}% de confiance)`
      };

      setTradingSignal(finalSignal);

      lastUpdateTime.current = now;
      setError(null);

    } catch (err) {
      setError(`Erreur: ${err.message}`);
      console.error('Erreur lors de la mise à jour:', err);
      retryCount.current = Math.min(retryCount.current + 1, MAX_RETRY_ATTEMPTS);
    } finally {
      setIsLoading(false);
    }
  }, [tradingSignal.signal]);

  // Mise à jour périodique avec gestion des erreurs
  useEffect(() => {
    updateData(); // Premier appel
    
    const interval = setInterval(() => {
      if (retryCount.current < MAX_RETRY_ATTEMPTS) {
        updateData();
      } else {
        setError('Nombre maximum de tentatives atteint. Réessayez plus tard.');
      }
    }, 60000); // Mise à jour toute les minutes

    return () => clearInterval(interval);
  }, [updateData]);

  // Fonction pour réinitialiser les erreurs
  const resetError = () => setError(null);

  // Fonction pour forcer une mise à jour manuelle
  const refreshData = () => {
    lastUpdateTime.current = 0; // Réinitialiser le temps pour forcer la mise à jour
    updateData();
  };

  return {
    bitcoinData,
    currentPrice,
    priceChange24h,
    indicators,
    sentiment,
    riskManagement,
    tradingSignal,
    prediction,
    signalHistory,
    isLoading,
    error,
    resetError,
    refreshData
  };
};

export default useTrading;
