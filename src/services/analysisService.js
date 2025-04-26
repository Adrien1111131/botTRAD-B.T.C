class AnalysisService {
  // Détection des divergences RSI avec gestion d'erreurs améliorée
  detectRSIDivergence(prices, rsiValues, lookback = 14) {
    try {
      if (!prices || !rsiValues || !Array.isArray(prices) || !Array.isArray(rsiValues)) {
        console.warn('Données invalides pour la détection de divergence RSI');
        return { bullish: false, bearish: false };
      }
      
      if (prices.length < lookback || rsiValues.length < lookback) {
        console.warn('Pas assez de données pour la détection de divergence RSI');
        return { bullish: false, bearish: false };
      }

      const priceHighs = [];
      const priceLows = [];
      const rsiHighs = [];
      const rsiLows = [];

      // Trouver les points hauts et bas locaux
      for (let i = 1; i < prices.length - 1; i++) {
        if (prices[i] > prices[i-1] && prices[i] > prices[i+1]) {
          priceHighs.push({ value: prices[i], index: i });
          rsiHighs.push({ value: rsiValues[i], index: i });
        }
        if (prices[i] < prices[i-1] && prices[i] < prices[i+1]) {
          priceLows.push({ value: prices[i], index: i });
          rsiLows.push({ value: rsiValues[i], index: i });
        }
      }

      // Vérifier les divergences
      const divergences = {
        bullish: false, // Prix fait des bas plus bas mais RSI fait des bas plus hauts
        bearish: false  // Prix fait des hauts plus hauts mais RSI fait des hauts plus bas
      };

      // Divergence baissière
      if (priceHighs.length >= 2 && rsiHighs.length >= 2) {
        const lastPriceHigh = priceHighs[priceHighs.length - 1];
        const prevPriceHigh = priceHighs[priceHighs.length - 2];
        const lastRsiHigh = rsiHighs[rsiHighs.length - 1];
        const prevRsiHigh = rsiHighs[rsiHighs.length - 2];

        if (lastPriceHigh.value > prevPriceHigh.value && lastRsiHigh.value < prevRsiHigh.value) {
          divergences.bearish = true;
        }
      }

      // Divergence haussière
      if (priceLows.length >= 2 && rsiLows.length >= 2) {
        const lastPriceLow = priceLows[priceLows.length - 1];
        const prevPriceLow = priceLows[priceLows.length - 2];
        const lastRsiLow = rsiLows[rsiLows.length - 1];
        const prevRsiLow = rsiLows[rsiLows.length - 2];

        if (lastPriceLow.value < prevPriceLow.value && lastRsiLow.value > prevRsiLow.value) {
          divergences.bullish = true;
        }
      }

      return divergences;
    } catch (error) {
      console.error('Erreur lors de la détection des divergences RSI:', error);
      return { bullish: false, bearish: false };
    }
  }

  // Détection des manipulations de marché avec gestion d'erreurs améliorée
  detectMarketManipulation(prices, volumes, timeframe = 60) {
    try {
      // Valeurs par défaut en cas d'erreur
      const defaultResult = {
        isPumpAndDump: false,
        isFakeout: false,
        isManipulated: false,
        confidence: 0,
        details: []
      };
      
      // Validation des entrées
      if (!prices || !volumes || !Array.isArray(prices) || !Array.isArray(volumes)) {
        console.warn('Données invalides pour la détection de manipulation');
        return defaultResult;
      }
      
      if (prices.length < 5 || volumes.length < 5) {
        console.warn('Pas assez de données pour la détection de manipulation');
        return defaultResult;
      }
      
      const result = { ...defaultResult };

      // Calcul des moyennes
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      // Calcul de la volatilité
      const volatility = this.calculateVolatility(prices);
      const normalVolatility = this.calculateAverageVolatility(prices, timeframe);

      // Détection Pump & Dump
      const volumeSpikes = volumes.filter(v => v > avgVolume * 3).length;
      const priceSpikes = prices.filter(p => Math.abs(p - avgPrice) > avgPrice * 0.1).length;

      if (volumeSpikes > 0 && priceSpikes > 0) {
        result.isPumpAndDump = true;
        result.details.push('Volume et prix anormalement élevés détectés');
      }

      // Détection Fake-out
      const recentPrices = prices.slice(-5);
      const priceChange = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
      const volumeChange = (volumes[volumes.length - 1] - volumes[0]) / volumes[0];

      if (Math.abs(priceChange) > 0.05 && volumeChange < 0) {
        result.isFakeout = true;
        result.details.push('Mouvement de prix sans support volumétrique');
      }

      // Évaluation globale
      result.isManipulated = result.isPumpAndDump || result.isFakeout;
      result.confidence = this.calculateManipulationConfidence(
        volatility,
        normalVolatility,
        volumeSpikes,
        priceSpikes
      );

      return result;
    } catch (error) {
      console.error('Erreur lors de la détection des manipulations:', error);
      return {
        isPumpAndDump: false,
        isFakeout: false,
        isManipulated: false,
        confidence: 0,
        details: ['Erreur lors de l\'analyse']
      };
    }
  }

  // Analyse de confluence des signaux avec gestion d'erreurs améliorée
  analyzeSignalConfluence(technicalSignals, manipulationData, supportResistance) {
    try {
      // Valeurs par défaut
      const defaultConfluence = {
        signal: 'ATTENDRE',
        strength: 0,
        reasons: ['Données insuffisantes pour l\'analyse']
      };
      
      // Validation des entrées
      if (!technicalSignals) {
        console.warn('Données techniques manquantes pour l\'analyse de confluence');
        return defaultConfluence;
      }
      
      const confluence = {
        signal: 'ATTENDRE',
        strength: 0,
        reasons: []
      };

      // Vérification des manipulations
      if (manipulationData && manipulationData.isManipulated) {
        confluence.signal = 'ATTENDRE';
        confluence.reasons.push('Manipulation de marché détectée');
        return confluence;
      }

      // Analyse des signaux techniques
      let bullishSignals = 0;
      let bearishSignals = 0;

      // RSI
      if (technicalSignals.rsi < 30) {
        bullishSignals++;
        confluence.reasons.push('RSI survendu');
      } else if (technicalSignals.rsi > 70) {
        bearishSignals++;
        confluence.reasons.push('RSI suracheté');
      }

      // MACD
      if (technicalSignals.macd && technicalSignals.macd.histogram > 0) {
        bullishSignals++;
        confluence.reasons.push('MACD positif');
      } else if (technicalSignals.macd && technicalSignals.macd.histogram < 0) {
        bearishSignals++;
        confluence.reasons.push('MACD négatif');
      }

      // Bandes de Bollinger
      if (technicalSignals.bollinger) {
        const { lower, upper, middle } = technicalSignals.bollinger;
        const currentPrice = technicalSignals.currentPrice;

        if (currentPrice < lower) {
          bullishSignals++;
          confluence.reasons.push('Prix sous la bande inférieure de Bollinger');
        } else if (currentPrice > upper) {
          bearishSignals++;
          confluence.reasons.push('Prix au-dessus de la bande supérieure de Bollinger');
        }
      }

      // Support/Résistance
      if (supportResistance && supportResistance.supports && supportResistance.resistances) {
        const supports = supportResistance.supports.filter(s => s < technicalSignals.currentPrice);
        const resistances = supportResistance.resistances.filter(r => r > technicalSignals.currentPrice);
        
        if (supports.length > 0 && resistances.length > 0) {
          const nearestSupport = Math.max(...supports);
          const nearestResistance = Math.min(...resistances);

          const distanceToSupport = technicalSignals.currentPrice - nearestSupport;
          const distanceToResistance = nearestResistance - technicalSignals.currentPrice;

          if (distanceToSupport < distanceToResistance * 0.2) {
            bullishSignals++;
            confluence.reasons.push('Proche d\'un support majeur');
          } else if (distanceToResistance < distanceToSupport * 0.2) {
            bearishSignals++;
            confluence.reasons.push('Proche d\'une résistance majeure');
          }
        }
      }

      // Détermination du signal final
      const totalSignals = bullishSignals + bearishSignals;
      if (totalSignals > 0) {
        const bullishStrength = bullishSignals / totalSignals;
        const bearishStrength = bearishSignals / totalSignals;

        if (bullishStrength > 0.7) {
          confluence.signal = 'ACHETER';
          confluence.strength = bullishStrength;
        } else if (bearishStrength > 0.7) {
          confluence.signal = 'VENDRE';
          confluence.strength = bearishStrength;
        } else {
          confluence.signal = 'ATTENDRE';
          confluence.strength = Math.max(bullishStrength, bearishStrength);
        }
      }

      return confluence;
    } catch (error) {
      console.error('Erreur lors de l\'analyse de confluence:', error);
      return {
        signal: 'ATTENDRE',
        strength: 0,
        reasons: ['Erreur lors de l\'analyse de confluence']
      };
    }
  }

  // Utilitaires avec gestion d'erreurs
  calculateVolatility(prices) {
    try {
      if (!prices || !Array.isArray(prices) || prices.length < 2) {
        return 0;
      }
      
      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        if (prices[i-1] !== 0) { // Éviter la division par zéro
          returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
      }
      
      if (returns.length === 0) return 0;
      
      return Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length);
    } catch (error) {
      console.error('Erreur lors du calcul de la volatilité:', error);
      return 0;
    }
  }

  calculateAverageVolatility(prices, timeframe) {
    try {
      if (!prices || !Array.isArray(prices) || prices.length < timeframe) {
        return 0;
      }
      
      const volatilities = [];
      for (let i = timeframe; i < prices.length; i += timeframe) {
        const slice = prices.slice(i - timeframe, i);
        volatilities.push(this.calculateVolatility(slice));
      }
      
      if (volatilities.length === 0) return 0;
      
      return volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
    } catch (error) {
      console.error('Erreur lors du calcul de la volatilité moyenne:', error);
      return 0;
    }
  }

  calculateManipulationConfidence(volatility, normalVolatility, volumeSpikes, priceSpikes) {
    try {
      let confidence = 0;
      
      // Volatilité anormale
      if (volatility > normalVolatility * 2) confidence += 0.3;
      if (volatility > normalVolatility * 3) confidence += 0.2;
      
      // Spikes de volume
      confidence += Math.min(volumeSpikes * 0.1, 0.3);
      
      // Spikes de prix
      confidence += Math.min(priceSpikes * 0.1, 0.2);
      
      return Math.min(confidence, 1);
    } catch (error) {
      console.error('Erreur lors du calcul de la confiance de manipulation:', error);
      return 0;
    }
  }
}

export default new AnalysisService();
