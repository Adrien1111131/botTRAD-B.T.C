class PredictionService {
  // Calcule une prédiction basée sur les indicateurs techniques
  calculatePrediction(currentPrice, indicators, sentiment) {
    try {
      const prediction = {
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
      };

      // Analyse de la tendance avec les moyennes mobiles
      if (indicators.sma20) {
        const trendStrength = (currentPrice - indicators.sma20) / indicators.sma20;
        if (Math.abs(trendStrength) > 0.02) {
          prediction.direction = trendStrength > 0 ? 'HAUSSIER' : 'BAISSIER';
          prediction.reasons.push(`Tendance ${prediction.direction.toLowerCase()} sur la SMA20`);
        }
      }

      // Analyse RSI
      if (indicators.rsi) {
        if (indicators.rsi > 70) {
          prediction.direction = 'BAISSIER';
          prediction.reasons.push('RSI en zone de surachat');
          prediction.risks.push('Risque de retournement baissier');
        } else if (indicators.rsi < 30) {
          prediction.direction = 'HAUSSIER';
          prediction.reasons.push('RSI en zone de survente');
          prediction.risks.push('Risque de retournement haussier');
        }
      }

      // Analyse MACD
      if (indicators.macd) {
        const { histogram } = indicators.macd;
        if (Math.abs(histogram) > 0) {
          const momentum = histogram > 0 ? 'HAUSSIER' : 'BAISSIER';
          prediction.reasons.push(`Momentum ${momentum.toLowerCase()} sur le MACD`);
          if (prediction.direction === 'NEUTRE') {
            prediction.direction = momentum;
          }
        }
      }

      // Analyse des bandes de Bollinger
      if (indicators.bollinger) {
        const { upper, lower, middle } = indicators.bollinger;
        const bandwidth = (upper - lower) / middle;
        
        if (currentPrice > upper) {
          prediction.risks.push('Prix au-dessus de la bande supérieure de Bollinger');
          prediction.direction = 'BAISSIER';
        } else if (currentPrice < lower) {
          prediction.risks.push('Prix en-dessous de la bande inférieure de Bollinger');
          prediction.direction = 'HAUSSIER';
        }

        // Calcul des fourchettes de prix
        const volatility = bandwidth * currentPrice;
        prediction.priceRanges = {
          oneHour: {
            min: currentPrice - (volatility * 0.3),
            max: currentPrice + (volatility * 0.3),
            confidence: 0.7
          },
          fourHours: {
            min: currentPrice - (volatility * 0.6),
            max: currentPrice + (volatility * 0.6),
            confidence: 0.5
          }
        };
      }

      // Analyse des niveaux clés
      if (indicators.supports && indicators.resistances) {
        prediction.keyLevels.support = [...indicators.supports];
        prediction.keyLevels.resistance = [...indicators.resistances];
        
        // Définir les objectifs de prix
        if (prediction.direction === 'HAUSSIER') {
          const nextResistance = indicators.resistances.find(r => r > currentPrice);
          if (nextResistance) {
            prediction.keyLevels.targets.push({
              price: nextResistance,
              type: 'RESISTANCE',
              confidence: 0.6
            });
          }
        } else if (prediction.direction === 'BAISSIER') {
          const nextSupport = indicators.supports.find(s => s < currentPrice);
          if (nextSupport) {
            prediction.keyLevels.targets.push({
              price: nextSupport,
              type: 'SUPPORT',
              confidence: 0.6
            });
          }
        }
      }

      // Analyse du sentiment
      if (sentiment) {
        const { fearGreedIndex, socialSentiment } = sentiment;
        if (fearGreedIndex > 70) {
          prediction.risks.push('Marché potentiellement suracheté (sentiment)');
        } else if (fearGreedIndex < 30) {
          prediction.risks.push('Marché potentiellement survendu (sentiment)');
        }
      }

      // Calcul de la confiance globale
      prediction.confidence = this.calculateConfidence(prediction, indicators, sentiment);

      return prediction;
    } catch (error) {
      console.error('Erreur lors du calcul des prédictions:', error);
      return {
        direction: 'NEUTRE',
        confidence: 0,
        priceRanges: {
          oneHour: { min: currentPrice * 0.99, max: currentPrice * 1.01, confidence: 0.3 },
          fourHours: { min: currentPrice * 0.98, max: currentPrice * 1.02, confidence: 0.2 }
        },
        keyLevels: { support: [], resistance: [], targets: [] },
        reasons: ['Erreur lors de l\'analyse'],
        risks: ['Données insuffisantes pour une prédiction fiable']
      };
    }
  }

  // Calcule le score de confiance global
  calculateConfidence(prediction, indicators, sentiment) {
    let confidenceScore = 0.5; // Score de base
    let factors = 0;

    // Force de la tendance
    if (indicators.sma20) {
      const trendStrength = Math.abs((indicators.currentPrice - indicators.sma20) / indicators.sma20);
      confidenceScore += trendStrength * 0.3;
      factors++;
    }

    // Confirmation RSI
    if (indicators.rsi) {
      if ((indicators.rsi > 70 && prediction.direction === 'BAISSIER') ||
          (indicators.rsi < 30 && prediction.direction === 'HAUSSIER')) {
        confidenceScore += 0.2;
      }
      factors++;
    }

    // Confirmation MACD
    if (indicators.macd) {
      const { histogram } = indicators.macd;
      if ((histogram > 0 && prediction.direction === 'HAUSSIER') ||
          (histogram < 0 && prediction.direction === 'BAISSIER')) {
        confidenceScore += 0.15;
      }
      factors++;
    }

    // Confirmation du sentiment
    if (sentiment && sentiment.fearGreedIndex) {
      if ((sentiment.fearGreedIndex > 70 && prediction.direction === 'BAISSIER') ||
          (sentiment.fearGreedIndex < 30 && prediction.direction === 'HAUSSIER')) {
        confidenceScore += 0.15;
      }
      factors++;
    }

    // Ajustement final
    confidenceScore = confidenceScore / (factors + 1);
    
    // Réduction de la confiance si trop de risques identifiés
    if (prediction.risks.length > 2) {
      confidenceScore *= 0.8;
    }

    return Math.min(Math.max(confidenceScore, 0), 1);
  }
}

export default new PredictionService();
